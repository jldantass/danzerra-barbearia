import { api } from "./api-painel.js";

const el = (id) => document.getElementById(id);
const area = el("operacao");
const dialogo = el("operacao-dialogo");
const detalhesAtendimento = el("atendimento-detalhes");
const campos = el("operacao-campos");
const confirmar = el("operacao-confirmar");
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const datas = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const meses = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const diasUteis = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const datasPlanner = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const diasPlanner = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const fuso = "America/Fortaleza";
const dataIso = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: fuso });
const horaIso = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: fuso });
const statusTexto = { AGENDADO: "Agendado", CONCLUIDO: "Concluído", CANCELADO: "Cancelado", FALTOU: "Faltou" };

let secao;
let aoExpirar;
let informar;
let sequencia = 0;
let consultaDetalhes = 0;
let edicao;
let diaAgenda = hoje();
let dataRenderizadaAgenda;
let diaRelatorio = hoje();
let periodoRelatorio = "SEMANA";

function hoje() {
    return dataIso.format(new Date());
}

function diaCurto(dia) {
    return datas.format(new Date(`${dia}T00:00:00Z`));
}

function deslocarDia(dia, deslocamento) {
    const date = new Date(`${dia}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + deslocamento);
    return date.toISOString().slice(0, 10);
}

function diaDaSemana(dia) {
    return new Date(`${dia}T00:00:00Z`).getUTCDay();
}

function segundaDaSemana(dia) {
    return deslocarDia(dia, -((diaDaSemana(dia) + 6) % 7));
}

function elem(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

function botao(texto, acao, classe = "discreto") {
    const node = elem("button", texto, `botao ${classe}`);
    node.type = "button";
    node.addEventListener("click", acao);
    return node;
}

function mensagemDialogo(texto = "") {
    const aviso = el("operacao-erro");
    aviso.textContent = texto;
    aviso.hidden = !texto;
}

function erro(erroApi, noDialogo = false) {
    if (erroApi.status === 401) aoExpirar(erroApi.message);
    else if (noDialogo) mensagemDialogo(erroApi.message);
    else informar("painel-aviso", erroApi.message, true);
}

function painel(titulo, ...filhos) {
    const caixa = elem("section", undefined, "folha");
    caixa.append(elem("h2", titulo), ...filhos);
    return caixa;
}

function estatisticas(itens, classe = "indicadores") {
    const lista = elem("dl", undefined, classe);
    for (const [rotulo, valor] of itens) {
        const item = elem("div");
        item.append(elem("dt", rotulo), elem("dd", valor, "numero"));
        lista.append(item);
    }
    return lista;
}

function dataCampo(valor, aoMudar) {
    const campo = elem("input");
    campo.type = "date";
    campo.value = valor;
    campo.setAttribute("aria-label", "Data");
    campo.addEventListener("change", () => { if (campo.value) aoMudar(campo.value); });
    return campo;
}

function controlesAgenda() {
    const barra = elem("header", undefined, "planner-topo");
    const periodo = elem("h2", undefined, "planner-periodo");
    periodo.id = "agenda-periodo";
    const navegacao = elem("div", undefined, "filtros-operacao planner-navegacao");
    const mover = (dias) => { diaAgenda = deslocarDia(diaAgenda, dias); carregar(); };
    const data = dataCampo(diaAgenda, (dia) => { diaAgenda = dia; carregar(); });
    data.id = "agenda-data-referencia";
    data.setAttribute("aria-label", "Escolher data de referência da semana");
    navegacao.append(
        botao("Semana anterior", () => mover(-7), "secundario"),
        data,
        botao("Próxima semana", () => mover(7), "secundario"),
        botao("Esta semana", () => { diaAgenda = hoje(); carregar(); }, "discreto"),
    );
    barra.append(periodo, navegacao);
    return barra;
}

function controlesRelatorio() {
    const controles = elem("div", undefined, "filtros-operacao");
    controles.id = "relatorio-filtros";
    const tipo = elem("select");
    tipo.setAttribute("aria-label", "Período");
    for (const [valor, nome] of [["DIA", "Dia"], ["SEMANA", "Semana"], ["MES", "Mês"]]) {
        tipo.add(new Option(nome, valor));
    }
    tipo.value = periodoRelatorio;
    const referencia = elem("div");
    function renderizarReferencia() {
        if (periodoRelatorio !== "MES") {
            referencia.replaceChildren(dataCampo(diaRelatorio, (dia) => { diaRelatorio = dia; carregar(); }));
            return;
        }
        const grupo = elem("div", undefined, "filtro-mes");
        const mes = elem("select");
        mes.setAttribute("aria-label", "Mês do relatório");
        for (let indice = 0; indice < 12; indice++) {
            const nome = meses.format(new Date(Date.UTC(2000, indice, 1)));
            mes.add(new Option(nome[0].toUpperCase() + nome.slice(1), String(indice + 1).padStart(2, "0")));
        }
        const ano = entrada("ano", "number", diaRelatorio.slice(0, 4));
        ano.min = "1";
        ano.max = "9999";
        ano.setAttribute("aria-label", "Ano do relatório");
        mes.value = diaRelatorio.slice(5, 7);
        function selecionarMes() {
            if (!ano.validity.valid) ano.value = diaRelatorio.slice(0, 4);
            diaRelatorio = `${String(ano.valueAsNumber).padStart(4, "0")}-${mes.value}-01`;
            carregar();
        }
        mes.addEventListener("change", selecionarMes);
        ano.addEventListener("change", selecionarMes);
        grupo.append(mes, ano);
        referencia.replaceChildren(grupo);
    }
    tipo.addEventListener("change", () => {
        periodoRelatorio = tipo.value;
        renderizarReferencia();
        carregar();
    });
    renderizarReferencia();
    controles.append(referencia, tipo);
    return controles;
}

function duracaoAtendimento(item) {
    return item.servicos.reduce((total, servico) => total + servico.duracaoMinutos, 0);
}

export function marcacaoAtendimento(item) {
    return elem("span", statusTexto[item.status], `marcacao estado-${item.status.toLowerCase()}`);
}

function acoesDoAtendimento(item) {
    const situacao = elem("div", undefined, "situacao-agenda");
    situacao.append(marcacaoAtendimento(item));
    if (item.status === "AGENDADO") {
        const comecou = item.inicio.slice(0, 16) <= `${hoje()}T${horaIso.format(new Date())}`;
        if (comecou) {
            situacao.append(botao("Concluir", () => confirmarSituacao(item, "CONCLUIDO"), "secundario"),
                botao("Marcar falta", () => confirmarSituacao(item, "FALTOU")));
        } else {
            situacao.append(botao("Remarcar", () => abrirAgenda(item), "secundario"));
        }
        situacao.append(botao("Cancelar", () => confirmarSituacao(item, "CANCELADO"), "discreto apagar"));
    }
    return situacao;
}

function botaoDoAtendimento(item, classe, sufixo = "") {
    const id = `agenda-atendimento-${item.id}${sufixo}`;
    const bloco = botao(undefined, () => mostrarDetalhesAtendimento(item, { idBotao: id }), classe);
    bloco.id = id;
    bloco.setAttribute("aria-haspopup", "dialog");
    return bloco;
}

function blocoDoPlanner(item, mostrarSituacao = false) {
    const li = elem("li");
    const bloco = botaoDoAtendimento(item, "bloco-planner");
    const horario = elem("span", undefined, "horario-planner");
    const inicio = elem("time", item.inicio.slice(11, 16));
    inicio.dateTime = item.inicio;
    horario.append(inicio, elem("span", `${duracaoAtendimento(item)} min`));
    const cliente = elem("strong", item.clienteNome, "cliente-planner");
    const ficha = elem("span", undefined, "cliente-planner-ficha");
    ficha.append(cliente);
    if (mostrarSituacao) ficha.append(marcacaoAtendimento(item));
    bloco.append(horario, ficha);
    li.append(bloco);
    return li;
}

function saldoDoAtendimento(plano, cobertos, previsto) {
    const saldo = elem("section", undefined, "saldo-com-plano");
    const topo = elem("div", undefined, "saldo-agenda-topo");
    topo.append(elem("h3", plano.nomePlano), elem("span", `Vencimento em ${diaCurto(plano.vencimento)}`));
    const beneficios = elem("ul", undefined, "saldo-agenda-beneficios");
    beneficios.setAttribute("aria-label", "Benefícios do plano");
    for (const beneficio of plano.beneficios) {
        const linha = elem("li");
        const unidade = beneficio.restantes === 1 ? "restante" : "restantes";
        const detalhe = elem("strong", `${beneficio.restantes} ${unidade}`);
        if (cobertos.has(beneficio.servicoId)) {
            detalhe.append(elem("span", previsto ? " (-1)" : " · 1 usado neste atendimento", "desconto-atendimento"));
        }
        linha.append(elem("span", beneficio.servicoNome), detalhe);
        beneficios.append(linha);
    }
    saldo.append(topo, beneficios);
    if (previsto) saldo.append(elem("p", "O desconto é aplicado na conclusão.", "ajuda"));
    return saldo;
}

function renderizarDetalhesAtendimento(item, plano, aviso = "") {
    el("atendimento-titulo").textContent = item.clienteNome;
    const data = new Date(`${item.inicio.slice(0, 10)}T00:00:00Z`);
    const resumo = estatisticas([
        ["Data", datasPlanner.format(data)],
        ["Horário", `${item.inicio.slice(11, 16)}–${item.fim.slice(11, 16)}`],
        ["Duração", `${duracaoAtendimento(item)} min`],
    ], "atendimento-resumo");

    const servicos = elem("section", undefined, "atendimento-servicos");
    const lista = elem("ul");
    const agendado = item.status === "AGENDADO";
    const disponiveis = new Set(plano?.beneficios.filter((beneficio) => beneficio.restantes > 0)
        .map((beneficio) => beneficio.servicoId));
    const cobertos = new Set();
    for (const servico of item.servicos) {
        const linha = elem("li");
        const descricao = elem("div");
        descricao.append(elem("strong", servico.nome), elem("span", `${servico.duracaoMinutos} min`, "ajuda"));
        const previsto = agendado && disponiveis.has(servico.servicoId);
        const peloPlano = servico.cobertoPorPlano || previsto;
        const preco = brl.format(servico.valorCobrado ?? servico.precoAvulso);
        const avulso = aviso && agendado ? `Preço avulso ${preco}` : `${preco} avulso`;
        const valor = peloPlano ? (previsto ? "Previsto pelo plano" : "Pelo plano") : avulso;
        if (peloPlano) cobertos.add(servico.servicoId);
        linha.append(descricao, elem("span", valor, peloPlano ? "cobertura-agenda" : undefined));
        lista.append(linha);
    }
    servicos.append(elem("h3", "Serviços"), lista);
    if (item.status === "CONCLUIDO") {
        const total = item.servicos.reduce((soma, servico) => soma + servico.valorCobrado, 0);
        servicos.append(elem("p", `Total avulso ${brl.format(total)}`, "atendimento-total"));
    }
    el("atendimento-dados").replaceChildren(resumo, servicos);
    if (plano && cobertos.size) el("atendimento-dados").append(saldoDoAtendimento(plano, cobertos, agendado));
    if (aviso) {
        const mensagem = elem("p", aviso, "ajuda");
        mensagem.setAttribute("role", "status");
        el("atendimento-dados").append(mensagem);
    }
}

export async function mostrarDetalhesAtendimento(item, { idBotao = "", consulta = false, aoExpirarSessao = aoExpirar } = {}) {
    const pedido = ++consultaDetalhes;
    const atual = () => detalhesAtendimento.open && pedido === consultaDetalhes;
    renderizarDetalhesAtendimento(item, null, "Consultando a cobertura do plano…");
    const acoes = el("atendimento-acoes");
    const mostrarAcoes = (atendimento) =>
        acoes.replaceChildren(consulta ? marcacaoAtendimento(atendimento) : acoesDoAtendimento(atendimento));
    mostrarAcoes(item);
    detalhesAtendimento.dataset.id = item.id;
    detalhesAtendimento.dataset.idBotao = idBotao;
    detalhesAtendimento.showModal();
    try {
        const { atendimento, plano } = await api(`/agendamentos/${item.id}`);
        if (!atual()) return;
        renderizarDetalhesAtendimento(atendimento, plano);
        if (atendimento.status !== item.status || atendimento.inicio !== item.inicio) {
            mostrarAcoes(atendimento);
        }
    } catch (falha) {
        if (!atual()) return;
        if (falha.status === 401) aoExpirarSessao(falha.message);
        else renderizarDetalhesAtendimento(item, null, "Não foi possível consultar a cobertura do plano.");
    }
}

function rotularHorariosLivres(planner) {
    const horaAtual = horaIso.format(new Date());
    for (const rotulo of planner.querySelectorAll("[data-horario-livre]")) {
        const passou = rotulo.dataset.horarioLivre <= horaAtual;
        const texto = passou ? "Horário passado" : "Disponível";
        if (rotulo.textContent === texto) continue;
        rotulo.textContent = texto;
        rotulo.classList.toggle("horario-passado", passou);
    }
}

function agendaDoDia(dia, faixas, atendimentos) {
    const planner = elem("div", undefined, "planner-hoje");
    planner.dataset.dia = dia;
    const porId = new Map(atendimentos.map((item) => [item.id, item]));
    for (const faixa of faixas) {
        const bloco = elem("section", undefined, "faixa-hoje");
        const inicioFaixa = faixa.inicio.slice(0, 5);
        const topo = elem("header", undefined, "faixa-hoje-topo");
        topo.append(elem("h3", inicioFaixa < "12:00" ? "Manhã" : "Tarde"),
            elem("span", `${inicioFaixa}–${faixa.fim.slice(0, 5)}`));
        const lista = elem("ol", undefined, "horarios-hoje");
        for (const horario of faixa.horarios) {
            const hora = horario.hora.slice(0, 5);
            const item = porId.get(horario.atendimentoId);
            const linha = elem("li");
            const inicio = elem("time", hora);
            inicio.dateTime = `${dia}T${hora}`;
            if (item) {
                const sufixo = item.inicio.slice(11, 16) === hora ? "" : `-${hora.replace(":", "")}`;
                const botaoOcupado = botaoDoAtendimento(item, "horario-hoje ocupado-hoje", sufixo);
                botaoOcupado.append(inicio, elem("strong", item.clienteNome));
                linha.append(botaoOcupado);
            } else {
                const livre = elem("div", undefined, "horario-hoje");
                const rotulo = elem("span");
                rotulo.dataset.horarioLivre = hora;
                livre.append(inicio, rotulo);
                linha.append(livre);
            }
            lista.append(linha);
        }
        bloco.append(topo, lista);
        planner.append(bloco);
    }
    if (!faixas.length) planner.append(elem("p", "Sem expediente hoje.", "ajuda"));
    const historico = atendimentos.filter((item) => item.status === "CANCELADO" || item.status === "FALTOU");
    if (historico.length) {
        const detalhes = elem("details", undefined, "historico-hoje");
        const lista = elem("ul", undefined, "planner-horarios");
        for (const item of historico) lista.append(blocoDoPlanner(item, true));
        detalhes.append(elem("summary", `Cancelados e faltas (${historico.length})`), lista);
        planner.append(detalhes);
    }
    rotularHorariosLivres(planner);
    return painel("Agenda do dia", planner);
}

function apresentarHoje(dia, agenda, resumo) {
    const colunas = elem("div", undefined, "caderno-hoje");
    const hojeLocal = `${hoje()}T${horaIso.format(new Date())}`;
    const proximo = agenda.atendimentos.find((item) => item.status === "AGENDADO" && item.fim.slice(0, 16) > hojeLocal);
    const lateral = elem("div", undefined, "resumo-hoje");
    const detalhes = proximo
        ? estatisticas([["Horário", proximo.inicio.slice(11, 16)], ["Cliente", proximo.clienteNome]], "totais-caixa")
        : elem("p", "Nenhum atendimento restante na agenda.", "ajuda");
    const { concluidos, avulsos, planos } = resumo.totais;
    lateral.append(painel("Próximo atendimento", detalhes),
        painel("Movimento do dia", estatisticas([
            ["Atendimentos realizados", concluidos],
            ["Recebido no dia", brl.format(avulsos + planos)],
        ], "totais-caixa")));
    colunas.append(agendaDoDia(dia, agenda.faixas, agenda.atendimentos), lateral);
    area.replaceChildren(colunas);
}

function areaDaAgenda() {
    let resultado = el("agenda-dados");
    if (!resultado) {
        resultado = elem("div");
        resultado.id = "agenda-dados";
        area.replaceChildren(controlesAgenda(), resultado);
    }
    const segunda = segundaDaSemana(diaAgenda);
    const inicio = new Date(`${segunda}T00:00:00Z`);
    const fim = new Date(`${deslocarDia(segunda, 5)}T00:00:00Z`);
    el("agenda-periodo").textContent = datasPlanner.formatRange(inicio, fim);
    el("agenda-data-referencia").value = diaAgenda;
    return resultado;
}

function apresentarAgenda(itens, resultado, segunda) {
    const dataAtual = hoje();
    const atendimentosPorDia = new Map();
    for (const item of itens) {
        const dia = item.inicio.slice(0, 10);
        if (!atendimentosPorDia.has(dia)) atendimentosPorDia.set(dia, []);
        atendimentosPorDia.get(dia).push(item);
    }
    const planner = elem("div", undefined, "planner");
    for (let indice = 0; indice < 6; indice++) {
        const dia = deslocarDia(segunda, indice);
        const coluna = elem("section", undefined, "planner-dia");
        coluna.dataset.dia = dia;
        coluna.dataset.estado = dia < dataAtual ? "concluido" : dia === dataAtual ? "hoje" : "futuro";
        const titulo = elem("h3", undefined, "planner-dia-titulo");
        titulo.id = `planner-dia-${dia}`;
        coluna.setAttribute("aria-labelledby", titulo.id);
        if (dia === dataAtual) coluna.setAttribute("aria-current", "date");
        const data = elem("time", dia.slice(-2));
        data.dateTime = dia;
        titulo.append(elem("span", diasPlanner.format(new Date(`${dia}T00:00:00Z`))), data);
        const cabecalho = elem("header", undefined, "planner-dia-topo");
        cabecalho.append(titulo);
        if (dia <= dataAtual) {
            cabecalho.append(elem("span", dia === dataAtual ? "Hoje" : "Dia concluído", "planner-dia-marcacao"));
        }
        const atendimentos = atendimentosPorDia.get(dia) ?? [];
        const lista = elem("ol", undefined, "planner-horarios");
        for (const atendimento of atendimentos) lista.append(blocoDoPlanner(atendimento));
        coluna.append(cabecalho, atendimentos.length ? lista : elem("p", "Sem atendimentos", "planner-vazio"));
        planner.append(coluna);
    }
    dataRenderizadaAgenda = dataAtual;
    resultado.replaceChildren(planner);
}

function atualizarRelogioDaAgenda() {
    const dataAtual = hoje();
    if (area.hidden || el("painel").hidden || dialogo.open || detalhesAtendimento.open) return;
    if (secao === "hoje") {
        const planner = area.querySelector(".planner-hoje");
        if (!planner) return;
        if (planner.dataset.dia === dataAtual) rotularHorariosLivres(planner);
        else carregar();
        return;
    }
    if (secao !== "agenda" || !dataRenderizadaAgenda || dataRenderizadaAgenda === dataAtual) return;
    if (segundaDaSemana(diaAgenda) === segundaDaSemana(dataRenderizadaAgenda)) diaAgenda = dataAtual;
    dataRenderizadaAgenda = undefined;
    carregar();
}

setInterval(atualizarRelogioDaAgenda, 30_000);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) atualizarRelogioDaAgenda();
});

function tabela(titulos, linhas, vazio) {
    if (!linhas.length) return elem("p", vazio, "ajuda");
    const caixa = elem("div", undefined, "tabela-area tabela-relatorio");
    const table = elem("table");
    const header = table.createTHead().insertRow();
    titulos.forEach((titulo) => {
        const th = elem("th", titulo);
        th.scope = "col";
        header.append(th);
    });
    const corpo = table.createTBody();
    for (const dados of linhas) {
        const linha = corpo.insertRow();
        dados.forEach((valor) => { linha.insertCell().textContent = valor; });
    }
    caixa.append(table);
    return caixa;
}

function grafico(dias, valor, formato, rotulo, diasDaSemana = []) {
    const eixo = elem("div", undefined, "grafico-periodo");
    const maximo = Math.max(1, ...dias.map(valor));
    for (const [indice, dia] of dias.entries()) {
        const numero = valor(dia);
        const coluna = elem("div", undefined, "grafico-coluna");
        const diaLabel = diaCurto(dia.dia);
        coluna.setAttribute("aria-label", `${diaLabel} · ${formato(numero)} ${rotulo}`);
        coluna.title = coluna.getAttribute("aria-label");
        const faixa = elem("span", undefined, "grafico-faixa");
        const barra = elem("span", undefined, "grafico-barra");
        barra.style.setProperty("--altura", `${numero / maximo * 100}%`);
        barra.setAttribute("aria-hidden", "true");
        faixa.append(barra);
        const numeroDia = dia.dia.slice(-2);
        const nomeDoDia = diasDaSemana[indice];
        coluna.append(faixa, elem("span", nomeDoDia ? `${nomeDoDia} ${numeroDia}` : numeroDia, "grafico-dia"));
        eixo.append(coluna);
    }
    return eixo;
}

function apresentarRelatorio(resumo, financeiro, resultado) {
    const { totais, dias } = resumo;
    const periodo = elem("p", resumo.inicio === resumo.fim ? diaCurto(resumo.inicio) :
        `${diaCurto(resumo.inicio)} a ${diaCurto(resumo.fim)}`, "faixa-periodo");
    resultado.replaceChildren(periodo);

    if (financeiro) {
        resultado.append(painel("Resumo de caixa", estatisticas([
            ["Serviços avulsos", brl.format(totais.avulsos)],
            ["Planos recebidos", brl.format(totais.planos)],
            ["Despesas registradas", brl.format(totais.despesas)],
            ["Resultado de caixa", brl.format(totais.resultado)],
        ])));
        if (dias.length > 1) {
            const rotulos = periodoRelatorio === "SEMANA" ? diasUteis : [];
            const diasDoGrafico = rotulos.length ? dias.slice(0, rotulos.length) : dias;
            resultado.append(painel("Entradas por dia",
                grafico(diasDoGrafico, (dia) => dia.avulsos + dia.planos, (valor) => brl.format(valor), "recebidos", rotulos)));
        }
        resultado.append(painel("Despesas do período", tabela(["Data", "Descrição", "Valor"],
            resumo.despesas.map((d) => [diaCurto(d.dia), d.descricao, brl.format(d.valor)]),
            "Nenhuma despesa registrada no período.")));
    } else {
        resultado.append(painel("Movimento", estatisticas([
            ["Realizados", totais.concluidos], ["Agendados", totais.agendados],
            ["Cancelados", totais.cancelados], ["Faltas", totais.faltas],
        ])));
        if (dias.length > 1) {
            resultado.append(painel("Atendimentos por dia", grafico(dias, (dia) => dia.concluidos, String, "atendimentos")));
        }
        resultado.append(painel("Serviços mais realizados", tabela(["Serviço", "Realizados", "Cobertos por plano"],
            resumo.servicos.map((s) => [s.nome, s.quantidade, s.cobertosPorPlano]),
            "Assim que houver atendimentos concluídos, os serviços aparecerão aqui.")));
    }
}

function areaDoRelatorio() {
    const atual = el("relatorio-dados");
    if (atual) return atual;
    const resultado = elem("div", undefined, "relatorio-dados");
    resultado.id = "relatorio-dados";
    area.replaceChildren(controlesRelatorio(), resultado);
    return resultado;
}

async function carregar() {
    const pedido = ++sequencia;
    const aba = secao;
    const resultado = aba === "agenda" ? areaDaAgenda()
        : aba === "financeiro" || aba === "atendimentos" ? areaDoRelatorio() : area;
    area.setAttribute("aria-busy", "true");
    resultado.replaceChildren(elem("p", "Carregando…", "ajuda"));
    try {
        if (aba === "hoje") {
            const dia = hoje();
            const [agenda, resumo] = await Promise.all([
                api(`/planejamento_agenda?dia=${dia}`), api(`/relatorios?dia=${dia}&periodo=DIA`),
            ]);
            if (pedido === sequencia) apresentarHoje(dia, agenda, resumo);
        } else if (aba === "agenda") {
            const segunda = segundaDaSemana(diaAgenda);
            const itens = await api(`/agendamentos?dia=${segunda}&semana=true`);
            if (pedido === sequencia) apresentarAgenda(itens, resultado, segunda);
        } else {
            const resumo = await api(`/relatorios?dia=${diaRelatorio}&periodo=${periodoRelatorio}`);
            if (pedido === sequencia) apresentarRelatorio(resumo, aba === "financeiro", resultado);
        }
    } catch (falha) {
        if (pedido === sequencia) {
            resultado.replaceChildren(botao("Tentar novamente", carregar, "secundario"));
            erro(falha);
        }
    } finally {
        if (pedido === sequencia) area.setAttribute("aria-busy", "false");
    }
}

export function mostrarOperacao(aba, aoSair, mostrarAviso) {
    secao = aba;
    aoExpirar = aoSair;
    informar = mostrarAviso;
    return carregar();
}

function rotular(titulo, controle) {
    const label = elem("label", titulo);
    label.append(controle);
    return label;
}

function entrada(nome, tipo, valor = "") {
    const input = elem("input");
    input.name = nome;
    input.type = tipo;
    input.value = valor;
    input.required = true;
    return input;
}

function abrirFormulario(titulo, acao, textoBotao = "Salvar") {
    if (dialogo.open) return null;
    const atual = { acao, ocupado: false };
    edicao = atual;
    el("operacao-dialogo-titulo").textContent = titulo;
    mensagemDialogo();
    campos.replaceChildren();
    confirmar.disabled = false;
    confirmar.textContent = textoBotao;
    dialogo.showModal();
    return atual;
}

function buscaClienteAgenda(atual, aoSelecionar) {
    const grupo = elem("div", undefined, "cliente-agenda");
    const campo = elem("input");
    campo.type = "search";
    campo.id = "agenda-cliente-busca";
    campo.placeholder = "Digite o nome ou celular";
    campo.autocomplete = "off";
    campo.setAttribute("role", "combobox");
    campo.setAttribute("aria-autocomplete", "list");
    campo.setAttribute("aria-expanded", "false");
    campo.setAttribute("aria-controls", "agenda-clientes-opcoes");
    campo.setAttribute("aria-required", "true");
    const lista = elem("ul", undefined, "opcoes-cliente-agenda");
    lista.id = "agenda-clientes-opcoes";
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-label", "Clientes encontrados");
    lista.hidden = true;
    const aviso = elem("p", "", "ajuda");
    aviso.setAttribute("role", "status");
    const retorno = elem("div", undefined, "retorno-cliente-agenda");
    retorno.append(lista, aviso);
    grupo.append(rotular("Cliente", campo), retorno);

    let sugestoes = [];
    let indice = -1;
    let selecionado = false;
    let consulta = 0;
    let timer;
    function recolher() {
        clearTimeout(timer);
        consulta++;
        sugestoes = [];
        indice = -1;
        lista.replaceChildren();
        lista.hidden = true;
        aviso.textContent = "";
        campo.setAttribute("aria-expanded", "false");
        campo.removeAttribute("aria-activedescendant");
    }
    function selecionar(cliente) {
        selecionado = true;
        campo.value = cliente.nome;
        recolher();
        aoSelecionar(cliente);
    }
    async function pesquisar() {
        const pedido = ++consulta;
        const termo = campo.value.trim();
        const filtro = /^[+\d\s().-]+$/.test(termo) ? "celular" : "nome";
        const params = new URLSearchParams({ [filtro]: termo, tamanho: 8 });
        aviso.textContent = "Buscando clientes…";
        try {
            const { clientes } = await api(`/clientes?${params}`);
            if (edicao !== atual || pedido !== consulta) return;
            sugestoes = clientes;
            clientes.forEach((cliente, posicao) => {
                const opcao = elem("li");
                opcao.id = `agenda-cliente-opcao-${posicao}`;
                opcao.setAttribute("role", "option");
                opcao.setAttribute("aria-selected", "false");
                opcao.append(elem("strong", cliente.nome), elem("span", cliente.celular));
                opcao.addEventListener("mousedown", (evento) => evento.preventDefault());
                opcao.addEventListener("click", () => selecionar(cliente));
                lista.append(opcao);
            });
            lista.hidden = !clientes.length;
            campo.setAttribute("aria-expanded", String(!lista.hidden));
            aviso.textContent = clientes.length ? "" : "Nenhum cliente encontrado.";
        } catch (falha) {
            if (edicao !== atual || pedido !== consulta) return;
            if (falha.status === 401) erro(falha, true);
            else aviso.textContent = "Não foi possível buscar clientes. Tente novamente.";
        }
    }

    campo.addEventListener("focus", () => { if (!selecionado) pesquisar(); });
    campo.addEventListener("blur", recolher);
    campo.addEventListener("input", () => {
        selecionado = false;
        recolher();
        aoSelecionar(null);
        aviso.textContent = "Buscando clientes…";
        timer = setTimeout(pesquisar, 200);
    });
    campo.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && (!lista.hidden || aviso.textContent)) {
            evento.preventDefault();
            recolher();
        } else if (evento.key === "Enter" && !selecionado) {
            evento.preventDefault();
            if (indice >= 0) selecionar(sugestoes[indice]);
        } else if (["ArrowDown", "ArrowUp"].includes(evento.key) && sugestoes.length) {
            evento.preventDefault();
            lista.children[indice]?.setAttribute("aria-selected", "false");
            const descendo = evento.key === "ArrowDown";
            indice = descendo ? (indice + 1) % sugestoes.length
                : indice <= 0 ? sugestoes.length - 1 : indice - 1;
            const opcao = lista.children[indice];
            opcao.setAttribute("aria-selected", "true");
            campo.setAttribute("aria-activedescendant", opcao.id);
            const boundsLista = lista.getBoundingClientRect();
            const boundsOpcao = opcao.getBoundingClientRect();
            if (boundsOpcao.top < boundsLista.top) lista.scrollTop += boundsOpcao.top - boundsLista.top;
            else if (boundsOpcao.bottom > boundsLista.bottom) lista.scrollTop += boundsOpcao.bottom - boundsLista.bottom;
        }
    });
    return { grupo, campo };
}

async function abrirAgenda(item) {
    const referencia = secao === "agenda" && diaAgenda > hoje() ? diaAgenda : hoje();
    const proximoDia = diaDaSemana(referencia) === 0 ? deslocarDia(referencia, 1) : referencia;
    const dia = entrada("dia", "date", item?.inicio.slice(0, 10) ?? proximoDia);
    const hora = elem("select");
    hora.id = "agenda-hora";
    hora.required = true;
    let cliente;
    const servicos = elem("fieldset", undefined, "servicos-agenda");
    const atuais = () => [...servicos.querySelectorAll("input:checked")].map((input) => Number(input.value));
    const atual = abrirFormulario(item ? "Remarcar atendimento" : "Agendar atendimento", async () => {
        const dados = { dia: dia.value, hora: hora.value };
        if (item) {
            await api(`/atualizar_agendamento/${item.id}`, { metodo: "PUT", dados });
        } else {
            await api("/cadastrar_agendamento", {
                metodo: "POST", dados: { ...dados, clienteId: cliente.id, servicoIds: atuais() },
            });
        }
        diaAgenda = dia.value;
        return item ? "Atendimento remarcado." : "Atendimento agendado.";
    });
    if (!atual) return;
    confirmar.disabled = true;
    dia.min = hoje();
    let pedido = 0;
    const atualizarConfirmacao = () => {
        if (edicao === atual && !atual.ocupado) confirmar.disabled = hora.disabled || (!item && !cliente);
    };
    atual.atualizarConfirmacao = atualizarConfirmacao;
    const buscarHorarios = async () => {
        const busca = ++pedido;
        mensagemDialogo();
        hora.disabled = true;
        atualizarConfirmacao();
        hora.replaceChildren(new Option("Escolha os serviços e a data", ""));
        const ids = atuais();
        if (!dia.value || (!item && !ids.length)) return;
        hora.options[0].text = "Buscando horários…";
        const query = new URLSearchParams({ dia: dia.value });
        if (item) query.set("atendimentoId", item.id);
        else query.set("servicoIds", ids.join(","));
        try {
            const horarios = await api(`/horarios_agenda?${query}`);
            if (edicao !== atual || busca !== pedido) return;
            hora.replaceChildren(new Option(horarios.length ? "Escolha um horário" : "Sem horários disponíveis", ""));
            horarios.forEach((inicio) => hora.add(new Option(inicio.slice(0, 5), inicio)));
            hora.disabled = !horarios.length;
            atualizarConfirmacao();
        } catch (falha) {
            if (edicao === atual && busca === pedido) erro(falha, true);
        }
    };
    dia.addEventListener("change", buscarHorarios);
    campos.append(rotular("Data do atendimento", dia));
    if (item) {
        campos.append(elem("p", `${item.clienteNome} · ${item.servicos.map((s) => s.nome).join(" · ")}`, "ajuda"));
        campos.append(rotular("Novo horário", hora));
        await buscarHorarios();
        return;
    }

    const saldo = elem("div", undefined, "saldo-agenda");
    saldo.setAttribute("aria-live", "polite");
    const nota = elem("p", undefined, "ajuda");
    const etiquetas = new Map();
    let periodo;
    let consultaPlano = 0;

    function atualizarCobertura() {
        const naVigencia = periodo?.ativo && dia.value >= periodo.inicio && dia.value <= periodo.vencimento;
        const disponiveis = naVigencia
            ? new Set(periodo.beneficios.filter((beneficio) => beneficio.restantes > 0).map((beneficio) => beneficio.servicoId))
            : new Set();
        for (const [id, etiqueta] of etiquetas) etiqueta.hidden = !disponiveis.has(id);
        nota.textContent = dia.value && !naVigencia
            ? "A data do atendimento está fora da vigência deste plano."
            : "O saldo é descontado ao concluir o atendimento.";
    }

    const busca = buscaClienteAgenda(atual, async (selecionado) => {
        const pedidoPlano = ++consultaPlano;
        cliente = selecionado;
        periodo = undefined;
        saldo.classList.remove("saldo-com-plano");
        saldo.replaceChildren();
        atualizarConfirmacao();
        atualizarCobertura();
        if (!cliente) return;
        saldo.append(elem("p", "Consultando benefício do plano…", "ajuda"));
        try {
            const perfil = await api(`/planos_cliente/${cliente.id}`);
            if (edicao !== atual || pedidoPlano !== consultaPlano) return;
            periodo = perfil.periodo;
            saldo.replaceChildren();
            if (!periodo?.ativo) {
                saldo.append(elem("p", "Cliente sem plano ativo.", "ajuda"));
                return;
            }
            const topo = elem("div", undefined, "saldo-agenda-topo");
            topo.append(elem("strong", periodo.nomePlano), elem("span", `Válido até ${diaCurto(periodo.vencimento)}`));
            const beneficios = elem("ul", undefined, "saldo-agenda-beneficios");
            beneficios.setAttribute("aria-label", "Benefícios restantes");
            for (const beneficio of periodo.beneficios) {
                const linha = elem("li");
                const unidade = beneficio.restantes === 1 ? "restante" : "restantes";
                linha.append(elem("span", beneficio.servicoNome), elem("strong", `${beneficio.restantes} ${unidade}`));
                beneficios.append(linha);
            }
            saldo.classList.add("saldo-com-plano");
            saldo.append(topo, beneficios, nota);
            atualizarCobertura();
        } catch (falha) {
            if (edicao !== atual || pedidoPlano !== consultaPlano) return;
            if (falha.status === 401) erro(falha, true);
            else saldo.replaceChildren(elem("p", "Não foi possível consultar o saldo do plano.", "ajuda"));
        }
    });
    dia.addEventListener("change", atualizarCobertura);
    servicos.addEventListener("change", buscarHorarios);
    servicos.append(elem("legend", "Serviços"));
    campos.append(busca.grupo, saldo, servicos, rotular("Horário", hora));
    hora.disabled = true;
    hora.add(new Option("Escolha os serviços e a data", ""));
    busca.campo.focus();
    try {
        const catalogo = await api("/servicos");
        if (edicao !== atual) return;
        for (const servico of catalogo) {
            const check = elem("input");
            check.type = "checkbox";
            check.value = servico.id;
            const label = elem("label", undefined, "servico-agenda");
            const nome = elem("span", servico.nome, "servico-agenda-nome");
            const cobertura = elem("span", "Previsto no plano", "cobertura-agenda");
            etiquetas.set(servico.id, cobertura);
            nome.append(cobertura);
            label.append(check, nome, elem("span", `${servico.duracaoMinutos} min`, "ajuda"));
            servicos.append(label);
        }
        if (!catalogo.length) servicos.append(elem("p", "Ative um serviço no catálogo para agendar.", "ajuda"));
        atualizarCobertura();
    } catch (falha) {
        if (edicao === atual) erro(falha, true);
    }
}

function confirmarSituacao(item, status) {
    const titulos = { CONCLUIDO: "Concluir atendimento", CANCELADO: "Cancelar atendimento", FALTOU: "Registrar falta" };
    const atual = abrirFormulario(titulos[status], async () => {
        const salvo = await api(`/status_agendamento/${item.id}`, { metodo: "PUT", dados: { status } });
        if (status === "CONCLUIDO") {
            const total = salvo.servicos.reduce((soma, s) => soma + s.valorCobrado, 0);
            return total ? `Atendimento concluído. Valor avulso: ${brl.format(total)}.` : "Atendimento concluído.";
        }
        return status === "CANCELADO" ? "Atendimento cancelado." : "Falta registrada.";
    }, "Confirmar");
    if (!atual) return;
    campos.append(elem("p", `${item.clienteNome} · ${item.inicio.slice(11, 16)}`));
    if (status === "CONCLUIDO") {
        campos.append(elem("p", "Ao confirmar, o sistema usa os benefícios disponíveis e registra os itens avulsos no caixa.", "ajuda"));
    }
}

function abrirDespesa() {
    const dia = entrada("dia", "date", hoje());
    const descricao = entrada("descricao", "text");
    descricao.maxLength = 120;
    const valor = entrada("valor", "number");
    valor.min = ".01";
    valor.max = "99999999.99";
    valor.step = ".01";
    const atual = abrirFormulario("Registrar despesa", async () => {
        await api("/cadastrar_despesa", {
            metodo: "POST", dados: { dia: dia.value, descricao: descricao.value, valor: Number(valor.value) },
        });
        diaRelatorio = dia.value;
        if (secao === "financeiro") area.replaceChildren();
        return "Despesa registrada.";
    });
    if (!atual) return;
    campos.append(rotular("Data", dia), rotular("Descrição", descricao), rotular("Valor (R$)", valor));
    descricao.focus();
}

export function abrirAcaoOperacional(aba) {
    if (aba === "financeiro") abrirDespesa();
    else abrirAgenda();
}

export function fecharOperacao() {
    sequencia++;
    fecharDialogo();
    detalhesAtendimento.close();
}

function fecharDialogo() {
    edicao = undefined;
    if (dialogo.open) dialogo.close();
}

el("operacao-fechar").addEventListener("click", fecharDialogo);
el("operacao-cancelar").addEventListener("click", fecharDialogo);
el("atendimento-fechar").addEventListener("click", () => detalhesAtendimento.close());
dialogo.addEventListener("cancel", (evento) => {
    if (edicao?.ocupado) evento.preventDefault();
    else edicao = undefined;
});
el("operacao-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const atual = edicao;
    if (!atual || atual.ocupado || confirmar.disabled) return;
    atual.ocupado = true;
    confirmar.disabled = el("operacao-fechar").disabled = el("operacao-cancelar").disabled = true;
    mensagemDialogo();
    try {
        const aviso = await atual.acao();
        if (edicao === atual) {
            const disparador = detalhesAtendimento.open ? { ...detalhesAtendimento.dataset } : undefined;
            fecharDialogo();
            detalhesAtendimento.close();
            informar("painel-aviso", aviso);
            await carregar();
            if (disparador && (secao === "agenda" || secao === "hoje")
                    && !area.hidden && !dialogo.open && !detalhesAtendimento.open) {
                const acionador = el(disparador.idBotao) ?? el(`agenda-atendimento-${disparador.id}`);
                (acionador?.getClientRects().length ? acionador : el("novo")).focus();
            }
        }
    } catch (falha) {
        if (edicao === atual) erro(falha, true);
    } finally {
        atual.ocupado = false;
        confirmar.disabled = el("operacao-fechar").disabled = el("operacao-cancelar").disabled = false;
        atual.atualizarConfirmacao?.();
    }
});
