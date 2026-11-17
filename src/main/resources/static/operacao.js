import { api } from "./api-painel.js";

const el = (id) => document.getElementById(id);
const area = el("operacao");
const dialogo = el("operacao-dialogo");
const detalhesAtendimento = el("atendimento-detalhes");
const campos = el("operacao-campos");
const confirmar = el("operacao-confirmar");
const cancelarOperacao = el("operacao-cancelar");
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const datas = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const meses = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const datasPlanner = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const diasPlanner = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });
const diasGrafico = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC",
});
const fuso = "America/Fortaleza";
const dataIso = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeZone: fuso });
const horaIso = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", timeZone: fuso });
const statusTexto = { AGENDADO: "Agendado", CONCLUIDO: "Concluído", CANCELADO: "Cancelado", FALTOU: "Faltou" };

let secao;
let aoExpirar;
let informar;
let abrirFicha;
let sequencia = 0;
let consultaDetalhes = 0;
let edicao;
let diaAgenda = hoje();
let dataRenderizadaAgenda;
let barbeiroFiltrado = "";
const filtrosRelatorio = {
    atendimentos: { dia: hoje(), periodo: "SEMANA" },
    financeiro: { dia: hoje(), periodo: "SEMANA" },
};

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
    const controles = elem("div", undefined, "planner-controles");
    const mover = (dias) => { diaAgenda = deslocarDia(diaAgenda, dias); carregar(); };
    const data = dataCampo(diaAgenda, (dia) => { diaAgenda = dia; carregar(); });
    data.id = "agenda-data-referencia";
    data.setAttribute("aria-label", "Escolher data de referência da semana");
    navegacao.append(
        botao("Semana anterior", () => mover(-7), "primario"),
        data,
        botao("Próxima semana", () => mover(7), "primario"),
        botao("Esta semana", () => { diaAgenda = hoje(); carregar(); }, "primario semana-atual"),
    );
    controles.append(navegacao);
    barra.append(periodo, controles);
    return barra;
}

function filtroDeBarbeiro(barbeiros) {
    const seletor = elem("select");
    seletor.id = "agenda-barbeiro-filtro";
    seletor.add(new Option("Todos os barbeiros", ""));
    for (const barbeiro of barbeiros) {
        seletor.add(new Option(barbeiro.nome + (barbeiro.ativo ? "" : " (inativo)"), barbeiro.id));
    }
    seletor.value = barbeiroFiltrado;
    seletor.addEventListener("change", () => {
        barbeiroFiltrado = seletor.value;
        carregar();
    });
    return rotular("Barbeiro da agenda", seletor);
}

export function controlesRelatorio(filtro, aoMudar = carregar) {
    const controles = elem("div", undefined, "filtros-operacao");
    controles.id = "relatorio-filtros";
    const tipo = elem("select");
    tipo.setAttribute("aria-label", "Período");
    for (const [valor, nome] of [["DIA", "Dia"], ["SEMANA", "Semana"], ["MES", "Mês"]]) {
        tipo.add(new Option(nome, valor));
    }
    tipo.value = filtro.periodo;
    const referencia = elem("div");
    function renderizarReferencia() {
        if (filtro.periodo !== "MES") {
            referencia.replaceChildren(dataCampo(filtro.dia, (dia) => { filtro.dia = dia; aoMudar(); }));
            return;
        }
        const grupo = elem("div", undefined, "filtro-mes");
        const mes = elem("select");
        mes.setAttribute("aria-label", "Mês do relatório");
        for (let indice = 0; indice < 12; indice++) {
            const nome = meses.format(new Date(Date.UTC(2000, indice, 1)));
            mes.add(new Option(nome[0].toUpperCase() + nome.slice(1), String(indice + 1).padStart(2, "0")));
        }
        const ano = entrada("ano", "number", filtro.dia.slice(0, 4));
        ano.min = "1";
        ano.max = "9999";
        ano.setAttribute("aria-label", "Ano do relatório");
        mes.value = filtro.dia.slice(5, 7);
        function selecionarMes() {
            if (!ano.validity.valid) ano.value = filtro.dia.slice(0, 4);
            filtro.dia = `${String(ano.valueAsNumber).padStart(4, "0")}-${mes.value}-01`;
            aoMudar();
        }
        mes.addEventListener("change", selecionarMes);
        ano.addEventListener("change", selecionarMes);
        grupo.append(mes, ano);
        referencia.replaceChildren(grupo);
    }
    tipo.addEventListener("change", () => {
        filtro.periodo = tipo.value;
        renderizarReferencia();
        aoMudar();
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
    if (item.status === "AGENDADO") {
        const comecou = item.inicio.slice(0, 16) <= `${hoje()}T${horaIso.format(new Date())}`;
        if (comecou) {
            situacao.append(botao("Concluir", () => confirmarSituacao(item, "CONCLUIDO"), "concluir"),
                botao("Marcar falta", () => confirmarSituacao(item, "FALTOU"), "marcar-falta"));
        } else {
            situacao.append(botao("Remarcar", () => abrirAgenda(item), "secundario"));
        }
        situacao.append(botao("Cancelar", () => confirmarSituacao(item, "CANCELADO"), "cancelar"));
    }
    return situacao;
}

function botaoDoAtendimento(item, classe, sufixo = "") {
    const id = `agenda-atendimento-${item.id}${sufixo}`;
    const bloco = botao(undefined, () => mostrarDetalhesAtendimento(item, { idBotao: id }), classe);
    bloco.id = id;
    bloco.dataset.status = item.status;
    bloco.setAttribute("aria-haspopup", "dialog");
    return bloco;
}

function blocoDoPlanner(item, mostrarSituacao = false) {
    const li = elem("li");
    const bloco = botaoDoAtendimento(item, "bloco-planner");
    const horario = elem("span", undefined, "horario-planner");
    const intervalo = elem("span", undefined, "intervalo-planner");
    const inicio = elem("time", item.inicio.slice(11, 16));
    const fim = elem("time", item.fim.slice(11, 16));
    inicio.dateTime = item.inicio;
    fim.dateTime = item.fim;
    intervalo.append(inicio, "–", fim);
    const duracao = `${duracaoAtendimento(item)} min`;
    horario.append(intervalo, elem("span", duracao, "duracao-planner"));
    const cliente = elem("strong", item.clienteNome, "cliente-planner");
    const ficha = elem("span", undefined, "cliente-planner-ficha");
    ficha.append(cliente);
    if (mostrarSituacao) ficha.append(marcacaoAtendimento(item));
    if (item.status === "CONCLUIDO" || item.status === "FALTOU") {
        if (!mostrarSituacao) {
            bloco.setAttribute("aria-label", `${inicio.textContent} a ${fim.textContent}, ${duracao}, ${item.clienteNome}, ${statusTexto[item.status]}`);
        }
    }
    bloco.append(horario, ficha, elem("span", item.barbeiroNome, "barbeiro-planner"));
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
    if (previsto) saldo.append(elem("p", "Previsão pela ordem dos horários. O desconto é aplicado na conclusão.", "ajuda"));
    return saldo;
}

function renderizarDetalhesAtendimento(item, plano, previsao, aviso = "") {
    el("atendimento-cliente").textContent = item.clienteNome;
    const data = new Date(`${item.inicio.slice(0, 10)}T00:00:00Z`);
    const resumo = estatisticas([
        ["Data", datasPlanner.format(data)],
        ["Horário", `${item.inicio.slice(11, 16)}–${item.fim.slice(11, 16)}`],
        ["Duração", `${duracaoAtendimento(item)} min`],
    ], "atendimento-resumo");

    const servicos = elem("section", undefined, "atendimento-servicos");
    const lista = elem("ul");
    const agendado = item.status === "AGENDADO";
    const cobertosNaPrevisao = new Set(previsao?.servicosPeloPlano);
    const cobertos = new Set();
    for (const servico of item.servicos) {
        const linha = elem("li");
        const descricao = elem("div");
        descricao.append(elem("strong", servico.nome), elem("span", `${servico.duracaoMinutos} min`, "ajuda"));
        const previsto = cobertosNaPrevisao.has(servico.servicoId);
        const peloPlano = servico.cobertoPorPlano || previsto;
        const preco = brl.format(servico.valorCobrado ?? servico.precoAvulso);
        const avulso = agendado ? (previsao ? `Previsto avulso · ${preco}` : `Preço avulso ${preco}`) : `${preco} avulso`;
        const valor = peloPlano ? (previsto ? "Previsto pelo plano" : "Pelo plano") : avulso;
        if (peloPlano) cobertos.add(servico.servicoId);
        linha.append(descricao, elem("span", valor, peloPlano ? "cobertura-agenda" : undefined));
        lista.append(linha);
    }
    servicos.append(elem("h3", "Serviços"), lista);
    if (item.status === "CONCLUIDO") {
        const total = item.servicos.reduce((soma, servico) => soma + servico.valorCobrado, 0);
        servicos.append(elem("p", `Total avulso ${brl.format(total)}`, "atendimento-total"));
    } else if (previsao) {
        servicos.append(elem("p", `Total avulso previsto ${brl.format(previsao.valorAvulso)}`, "atendimento-total"));
    }
    el("atendimento-dados").replaceChildren(resumo,
        elem("p", `Barbeiro · ${item.barbeiroNome}`, "ajuda"), servicos);
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
    renderizarDetalhesAtendimento(item, null, null, "Consultando a cobertura do plano…");
    el("atendimento-cliente").onclick = () => {
        detalhesAtendimento.close();
        if (!consulta) abrirFicha({ id: item.clienteId, nome: item.clienteNome, celular: "" });
    };
    const acoes = el("atendimento-acoes");
    function mostrarSituacao(atendimento) {
        el("atendimento-situacao").replaceChildren(marcacaoAtendimento(atendimento));
        acoes.hidden = consulta || atendimento.status !== "AGENDADO";
        acoes.replaceChildren();
        if (!acoes.hidden) acoes.append(acoesDoAtendimento(atendimento));
    }
    mostrarSituacao(item);
    detalhesAtendimento.dataset.id = item.id;
    detalhesAtendimento.dataset.idBotao = idBotao;
    detalhesAtendimento.showModal();
    try {
        const { atendimento, plano, previsao } = await api(`/agendamentos/${item.id}`);
        if (!atual()) return;
        renderizarDetalhesAtendimento(atendimento, plano, previsao);
        if (atendimento.status !== item.status || atendimento.inicio !== item.inicio) {
            mostrarSituacao(atendimento);
        }
    } catch (falha) {
        if (!atual()) return;
        if (falha.status === 401) aoExpirarSessao(falha.message);
        else renderizarDetalhesAtendimento(item, null, null, "Não foi possível consultar a cobertura do plano.");
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

function plannerDoBarbeiro(dia, faixas, atendimentos, ativo) {
    const planner = elem("div", undefined, "horarios-barbeiro");
    const porId = new Map(atendimentos.map((item) => [item.id, item]));
    const faltasVisiveis = new Set();
    for (const faixa of faixas) {
        const bloco = elem("section", undefined, "faixa-hoje");
        const inicioFaixa = faixa.inicio.slice(0, 5);
        const topo = elem("header", undefined, "faixa-hoje-topo");
        topo.append(elem("h4", inicioFaixa < "12:00" ? "Manhã" : "Tarde"),
            elem("span", `${inicioFaixa}–${faixa.fim.slice(0, 5)}`));
        const lista = elem("ol", undefined, "horarios-hoje");
        for (const horario of faixa.horarios) {
            const hora = horario.hora.slice(0, 5);
            const itens = [...horario.atendimentoIds, ...horario.faltasIds]
                .map((id) => porId.get(id)).filter(Boolean);
            const linha = elem("li");
            const inicio = elem("time", hora);
            inicio.dateTime = `${dia}T${hora}`;
            for (const item of itens) {
                const sufixo = item.inicio.slice(11, 16) === hora ? "" : `-${hora.replace(":", "")}`;
                const botaoOcupado = botaoDoAtendimento(item, "horario-hoje ocupado-hoje", sufixo);
                const cliente = elem("span", undefined, "horario-hoje-cliente");
                cliente.append(elem("strong", item.clienteNome));
                if (item.status === "FALTOU") {
                    faltasVisiveis.add(item.id);
                    cliente.append(elem("small", "(falta)"));
                }
                botaoOcupado.append(inicio.cloneNode(true), cliente);
                linha.append(botaoOcupado);
            }
            if (!itens.length) {
                const livre = elem("div", undefined, "horario-hoje");
                const rotulo = elem("span");
                if (ativo) rotulo.dataset.horarioLivre = hora;
                else rotulo.textContent = "Indisponível";
                livre.append(inicio, rotulo);
                linha.append(livre);
            }
            lista.append(linha);
        }
        bloco.append(topo, lista);
        planner.append(bloco);
    }
    if (!faixas.length) planner.append(elem("p", "Sem expediente hoje.", "ajuda"));
    const historico = atendimentos.filter((item) => item.status === "CANCELADO"
        || (item.status === "FALTOU" && !faltasVisiveis.has(item.id)));
    if (historico.length) {
        const detalhes = elem("details", undefined, "historico-hoje");
        const lista = elem("ul", undefined, "planner-horarios");
        for (const item of historico) lista.append(blocoDoPlanner(item, true));
        const resumo = historico.some((item) => item.status === "FALTOU") ? "Cancelados e faltas" : "Cancelados";
        detalhes.append(elem("summary", `${resumo} (${historico.length})`), lista);
        planner.append(detalhes);
    }
    return planner;
}

function agendaDoDia(dia, faixas, atendimentos, barbeiros) {
    const planner = elem("div", undefined, "planner-hoje agendas-barbeiros");
    planner.dataset.dia = dia;
    const porBarbeiro = new Map();
    for (const item of atendimentos) {
        if (!porBarbeiro.has(item.barbeiroId)) porBarbeiro.set(item.barbeiroId, []);
        porBarbeiro.get(item.barbeiroId).push(item);
    }
    const profissionais = barbeiros.filter((barbeiro) => barbeiroFiltrado
        ? String(barbeiro.id) === barbeiroFiltrado : barbeiro.ativo || porBarbeiro.has(barbeiro.id));
    planner.style.setProperty("--barbeiros-visiveis", Math.max(1, profissionais.length));
    for (const barbeiro of profissionais) {
        const secao = elem("section", undefined, "agenda-barbeiro-hoje");
        secao.dataset.barbeiroId = barbeiro.id;
        const titulo = elem("h3", barbeiro.nome);
        titulo.id = `agenda-barbeiro-titulo-${barbeiro.id}`;
        secao.setAttribute("aria-labelledby", titulo.id);
        const topo = elem("header", undefined, "agenda-barbeiro-topo");
        topo.append(titulo);
        if (!barbeiro.ativo) topo.append(elem("span", "Inativo", "estado"));
        secao.append(topo, plannerDoBarbeiro(dia, faixas, porBarbeiro.get(barbeiro.id) ?? [], barbeiro.ativo));
        planner.append(secao);
    }
    if (!profissionais.length) {
        planner.append(elem("p", "Cadastre ou ative um barbeiro para visualizar os horários.", "ajuda"));
    }
    rotularHorariosLivres(planner);
    const agenda = painel("Agenda do dia", planner);
    const topo = elem("header", undefined, "agenda-dia-topo");
    topo.append(agenda.querySelector("h2"), filtroDeBarbeiro(barbeiros));
    agenda.prepend(topo);
    return agenda;
}

function apresentarHoje(dia, agenda, resumo, barbeiros) {
    const hojeLocal = `${hoje()}T${horaIso.format(new Date())}`;
    const pendentes = agenda.atendimentos.filter((item) => item.status === "AGENDADO" && item.fim.slice(0, 16) > hojeLocal);
    const proximos = pendentes.filter((item) => item.inicio === pendentes[0]?.inicio);
    const resumos = el("hoje-resumos");
    const detalhes = elem("ul", undefined, "proximos-atendimentos");
    for (const proximo of proximos) {
        const linha = elem("li");
        const horario = elem("time", proximo.inicio.slice(11, 16));
        horario.dateTime = proximo.inicio;
        const pessoa = elem("div", undefined, "proximo-cliente");
        pessoa.append(elem("strong", proximo.clienteNome), elem("span", proximo.barbeiroNome));
        linha.append(horario, pessoa);
        detalhes.append(linha);
    }
    const titulo = proximos.length > 1 ? "Próximos atendimentos" : "Próximo atendimento";
    const { concluidos, avulsos, planos } = resumo.totais;
    resumos.replaceChildren(painel(titulo, proximos.length ? detalhes
        : elem("p", "Nenhum atendimento restante na agenda.", "ajuda")),
        painel("Movimento da barbearia", estatisticas([
            ["Atendimentos realizados", concluidos],
            ["Recebido no dia", brl.format(avulsos + planos)],
        ], "totais-caixa")));
    area.replaceChildren(agendaDoDia(dia, agenda.faixas, agenda.atendimentos, barbeiros));
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
        const registros = atendimentosPorDia.get(dia) ?? [];
        const atendimentos = registros.filter((item) => item.status !== "CANCELADO");
        const cancelados = registros.filter((item) => item.status === "CANCELADO");
        const lista = elem("ol", undefined, "planner-horarios");
        for (const atendimento of atendimentos) lista.append(blocoDoPlanner(atendimento));
        coluna.append(cabecalho, atendimentos.length ? lista : elem("p", "Sem atendimentos", "planner-vazio"));
        if (cancelados.length) {
            const historico = elem("details", undefined, "planner-cancelados");
            const listaCancelados = elem("ul", undefined, "planner-horarios");
            for (const cancelado of cancelados) listaCancelados.append(blocoDoPlanner(cancelado, true));
            historico.append(elem("summary", `Cancelados (${cancelados.length})`, "resumo-cancelados"), listaCancelados);
            coluna.append(historico);
        }
        planner.append(coluna);
    }
    dataRenderizadaAgenda = dataAtual;
    const legenda = elem("ul", undefined, "planner-legenda");
    legenda.setAttribute("aria-label", "Legenda dos riscos");
    legenda.append(elem("li", "Concluído", "risco-concluido"), elem("li", "Falta", "risco-falta"));
    resultado.replaceChildren(legenda, planner);
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

function graficoDiario(dias, valor, formatar, minimoDaEscala) {
    const lista = elem("ul", undefined, "grafico-diario");
    const maximo = Math.max(minimoDaEscala, ...dias.map(valor));
    const diaAtual = hoje();
    for (const dia of dias) {
        const linha = elem("li");
        const numero = valor(dia);
        const data = elem("time", diasGrafico.format(new Date(`${dia.dia}T00:00:00Z`)));
        data.dateTime = dia.dia;
        if (dia.dia === diaAtual) data.setAttribute("aria-current", "date");
        const faixa = elem("span", undefined, "grafico-diario-faixa");
        faixa.setAttribute("aria-hidden", "true");
        const barra = elem("span");
        barra.style.setProperty("--proporcao", `${numero / maximo * 100}%`);
        faixa.append(barra);
        linha.append(data, faixa, elem("strong", formatar(numero)));
        lista.append(linha);
    }
    return lista;
}

function apresentarRelatorio(resumo, financeiro, resultado, tipoPeriodo) {
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
            const diasDoGrafico = tipoPeriodo === "SEMANA" ? dias.slice(0, 6) : dias;
            resultado.append(painel("Entradas por dia",
                graficoDiario(diasDoGrafico, (dia) => dia.avulsos + dia.planos, (valor) => brl.format(valor), 1)));
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
            resultado.append(painel("Atendimentos concluídos por dia",
                graficoDiario(dias, (dia) => dia.concluidos, String, 4)));
        }
        resultado.append(painel("Serviços mais realizados", tabela(["Serviço", "Realizados", "Cobertos por plano"],
            resumo.servicos.map((s) => [s.nome, s.quantidade, s.cobertosPorPlano]),
            "Assim que houver atendimentos concluídos, os serviços aparecerão aqui.")));
    }
}

function areaDoRelatorio(aba) {
    const atual = el("relatorio-dados");
    const filtrosFinanceiro = el("financeiro-filtros");
    if (atual?.dataset.aba === aba && (aba !== "financeiro" || filtrosFinanceiro.childElementCount)) return atual;
    const resultado = elem("div", undefined, "relatorio-dados");
    resultado.id = "relatorio-dados";
    resultado.dataset.aba = aba;
    const controles = controlesRelatorio(filtrosRelatorio[aba]);
    if (aba === "financeiro") {
        filtrosFinanceiro.replaceChildren(controles);
        area.replaceChildren(resultado);
    } else {
        area.replaceChildren(controles, resultado);
    }
    return resultado;
}

async function carregar() {
    const pedido = ++sequencia;
    const aba = secao;
    const resultado = aba === "agenda" ? areaDaAgenda()
        : filtrosRelatorio[aba] ? areaDoRelatorio(aba) : area;
    area.setAttribute("aria-busy", "true");
    resultado.replaceChildren(elem("p", "Carregando…", "ajuda"));
    try {
        let barbeiros;
        const filtro = new URLSearchParams();
        if (aba === "hoje" || aba === "agenda") {
            barbeiros = await api("/barbeiros?incluirInativos=true");
            if (pedido !== sequencia) return;
            if (!barbeiros.some((barbeiro) => String(barbeiro.id) === barbeiroFiltrado)) barbeiroFiltrado = "";
            if (barbeiroFiltrado) filtro.set("barbeiroId", barbeiroFiltrado);
        }
        if (aba === "hoje") {
            const dia = hoje();
            filtro.set("dia", dia);
            const [agenda, resumo] = await Promise.all([
                api(`/planejamento_agenda?${filtro}`), api(`/relatorios?dia=${dia}&periodo=DIA`),
            ]);
            if (pedido === sequencia) apresentarHoje(dia, agenda, resumo, barbeiros);
        } else if (aba === "agenda") {
            el("agenda-barbeiro-filtro")?.parentElement.remove();
            area.querySelector(".planner-controles").append(filtroDeBarbeiro(barbeiros));
            const segunda = segundaDaSemana(diaAgenda);
            filtro.set("dia", segunda);
            filtro.set("semana", "true");
            const itens = await api(`/agendamentos?${filtro}`);
            if (pedido === sequencia) apresentarAgenda(itens, resultado, segunda);
        } else {
            const { dia, periodo } = filtrosRelatorio[aba];
            const resumo = await api(`/relatorios?dia=${dia}&periodo=${periodo}`);
            if (pedido === sequencia) apresentarRelatorio(resumo, aba === "financeiro", resultado, periodo);
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

export function mostrarOperacao(aba, aoSair, mostrarAviso, mostrarFicha) {
    secao = aba;
    aoExpirar = aoSair;
    informar = mostrarAviso;
    abrirFicha = mostrarFicha;
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

function abrirFormulario(titulo, acao, {
    textoBotao = "Salvar", classeBotao = "primario", textoCancelar = "Cancelar",
} = {}) {
    if (dialogo.open) return null;
    const atual = { acao, ocupado: false };
    edicao = atual;
    el("operacao-dialogo-titulo").textContent = titulo;
    mensagemDialogo();
    campos.replaceChildren();
    confirmar.disabled = false;
    confirmar.textContent = textoBotao;
    confirmar.className = `botao ${classeBotao}`;
    cancelarOperacao.textContent = textoCancelar;
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
    const barbeiro = elem("select");
    barbeiro.id = "agenda-barbeiro";
    barbeiro.required = true;
    barbeiro.disabled = true;
    barbeiro.add(new Option("Carregando barbeiros…", ""));
    let cliente;
    const servicos = elem("fieldset", undefined, "servicos-agenda");
    const atuais = () => [...servicos.querySelectorAll("input:checked")].map((input) => Number(input.value));
    const atual = abrirFormulario(item ? "Remarcar atendimento" : "Agendar atendimento", async () => {
        const dados = { dia: dia.value, hora: hora.value, barbeiroId: Number(barbeiro.value) };
        if (item) {
            await api(`/atualizar_agendamento/${item.id}`, { metodo: "PUT", dados });
        } else {
            await api("/cadastrar_agendamento", {
                metodo: "POST", dados: { ...dados, clienteId: cliente.id, servicoIds: atuais() },
            });
        }
        diaAgenda = dia.value;
        if (barbeiroFiltrado) barbeiroFiltrado = barbeiro.value;
        return item ? "Atendimento remarcado." : "Atendimento agendado.";
    });
    if (!atual) return;
    confirmar.disabled = true;
    dia.min = hoje();
    let pedido = 0;
    const atualizarConfirmacao = () => {
        if (edicao === atual && !atual.ocupado) {
            confirmar.disabled = !barbeiro.value || hora.disabled || !hora.value || (!item && !cliente);
        }
    };
    atual.atualizarConfirmacao = atualizarConfirmacao;
    const buscarHorarios = async () => {
        const busca = ++pedido;
        mensagemDialogo();
        hora.disabled = true;
        atualizarConfirmacao();
        hora.replaceChildren(new Option("Escolha o barbeiro, os serviços e a data", ""));
        const ids = atuais();
        if (!barbeiro.value || !dia.value || (!item && !ids.length)) return;
        hora.options[0].text = "Buscando horários…";
        const query = new URLSearchParams({ dia: dia.value, barbeiroId: barbeiro.value });
        if (cliente) query.set("clienteId", cliente.id);
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
    barbeiro.addEventListener("change", buscarHorarios);
    hora.addEventListener("change", atualizarConfirmacao);
    campos.append(rotular("Barbeiro", barbeiro), rotular("Data do atendimento", dia));
    try {
        const profissionais = await api("/barbeiros");
        if (edicao !== atual) return;
        barbeiro.replaceChildren(new Option(profissionais.length ? "Selecione o barbeiro" : "Cadastre ou ative um barbeiro", ""));
        for (const profissional of profissionais) barbeiro.add(new Option(profissional.nome, profissional.id));
        barbeiro.value = String(item?.barbeiroId ?? barbeiroFiltrado);
        barbeiro.disabled = !profissionais.length;
        if (!profissionais.length) {
            campos.append(elem("p", "Cadastre um profissional ativo na aba Barbeiros para agendar.", "ajuda"));
        } else if (item && !barbeiro.value) {
            campos.append(elem("p", "O barbeiro deste atendimento está inativo. Selecione outro profissional.", "ajuda"));
        }
    } catch (falha) {
        if (edicao === atual) {
            barbeiro.replaceChildren(new Option("Não foi possível carregar os barbeiros", ""));
            erro(falha, true);
        }
        return;
    }
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
        buscarHorarios();
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
    hora.add(new Option("Escolha o barbeiro, os serviços e a data", ""));
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
            const cobertura = elem("span", "Com saldo no plano", "cobertura-agenda");
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
    const concluindo = status === "CONCLUIDO";
    const cancelando = status === "CANCELADO";
    let totalConfirmado;
    const resumoValor = elem("p", "Consultando valor avulso…", "ajuda");
    resumoValor.setAttribute("role", "status");
    const atual = abrirFormulario(titulos[status], async () => {
        let salvo;
        try {
            salvo = await api(`/status_agendamento/${item.id}`, {
                metodo: "PUT", dados: { status, valorAvulsoConfirmado: totalConfirmado },
            });
        } catch (falha) {
            if (concluindo && falha.status === 409 && edicao === atual) await consultarTotal();
            throw falha;
        }
        if (concluindo) {
            const total = salvo.servicos.reduce((soma, s) => soma + s.valorCobrado, 0);
            return total ? `Atendimento concluído. Valor avulso: ${brl.format(total)}.` : "Atendimento concluído.";
        }
        return cancelando ? "Atendimento cancelado." : "Falta registrada.";
    }, {
        textoBotao: cancelando ? "Confirmar cancelamento" : "Confirmar",
        classeBotao: concluindo || cancelando ? "concluir" : "marcar-falta",
        textoCancelar: cancelando ? "Não cancelar" : "Cancelar",
    });
    if (!atual) return;
    campos.append(elem("p", `${item.clienteNome} · ${item.inicio.slice(11, 16)}`));
    if (!concluindo) return;
    atual.atualizarConfirmacao = () => {
        if (edicao === atual && !atual.ocupado) confirmar.disabled = totalConfirmado === undefined;
    };
    const tentar = botao("Consultar valor novamente", () => consultarTotal(), "secundario");
    tentar.hidden = true;
    campos.append(resumoValor, elem("p", "Ao confirmar, o sistema usa os benefícios disponíveis e registra os itens avulsos no caixa.", "ajuda"), tentar);
    consultarTotal();

    async function consultarTotal() {
        totalConfirmado = undefined;
        atual.atualizarConfirmacao();
        tentar.hidden = true;
        resumoValor.textContent = "Consultando valor avulso…";
        try {
            const { previsao } = await api(`/agendamentos/${item.id}`);
            if (edicao !== atual) return;
            totalConfirmado = previsao?.valorAvulsoAgora;
            resumoValor.textContent = totalConfirmado === undefined
                ? "O atendimento já passou para outra situação."
                : `Total avulso ao concluir agora: ${brl.format(totalConfirmado)}.`;
        } catch (falha) {
            if (edicao !== atual) return;
            if (falha.status === 401) erro(falha, true);
            else {
                resumoValor.textContent = "Não foi possível consultar o valor avulso.";
                tentar.hidden = false;
            }
        } finally {
            atual.atualizarConfirmacao();
        }
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
        filtrosRelatorio.financeiro.dia = dia.value;
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
cancelarOperacao.addEventListener("click", fecharDialogo);
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
    confirmar.disabled = el("operacao-fechar").disabled = cancelarOperacao.disabled = true;
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
        confirmar.disabled = el("operacao-fechar").disabled = cancelarOperacao.disabled = false;
        atual.atualizarConfirmacao?.();
    }
});
