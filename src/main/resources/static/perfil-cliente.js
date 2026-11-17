import { api } from "./api-painel.js";
import { marcacaoAtendimento, mostrarDetalhesAtendimento } from "./operacao.js";

const porId = (id) => document.getElementById(id);
const dialogo = porId("perfil-cliente");
const dados = porId("perfil-dados");
const agendamentos = porId("perfil-agendamentos");
const formulario = porId("perfil-contratacao");
const seletor = porId("perfil-plano");
const adicionar = porId("perfil-adicionar");
const confirmar = porId("perfil-confirmar");
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
let contexto;
let tempoAviso;

function elemento(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

function mensagem(id, texto = "") {
    const node = porId(id);
    node.textContent = texto;
    node.hidden = !texto;
    if (id === "perfil-aviso") {
        clearTimeout(tempoAviso);
        if (texto) tempoAviso = setTimeout(() => mensagem(id), 5000);
    }
}

function tratarErro(erro, atual) {
    if (contexto !== atual) return;
    if (erro.status === 401) {
        atual.aoExpirarSessao(erro.message);
    } else {
        mensagem("perfil-erro", erro.message);
    }
}

function formatarData(valor) {
    return dataBr.format(new Date(`${valor}T00:00:00Z`));
}

function linhaResumo(rotulo, valor) {
    const linha = elemento("div");
    linha.append(elemento("dt", rotulo), elemento("dd", valor));
    return linha;
}

function atualizarProjecaoBeneficios() {
    const { periodo, agendamentos: itens } = contexto;
    if (!periodo?.ativo || !itens) return;

    const usosPrevistos = new Map();
    for (const item of itens) {
        const dia = item.inicio.slice(0, 10);
        if (item.status !== "AGENDADO" || dia < periodo.inicio || dia > periodo.vencimento) continue;
        for (const servico of item.servicos) {
            usosPrevistos.set(servico.servicoId, (usosPrevistos.get(servico.servicoId) ?? 0) + 1);
        }
    }
    for (const rotulo of dados.querySelectorAll("[data-projecao-servico]")) {
        const beneficio = periodo.beneficios.find((item) => item.servicoId === Number(rotulo.dataset.projecaoServico));
        const usos = usosPrevistos.get(beneficio.servicoId) ?? 0;
        rotulo.hidden = !usos || !beneficio.restantes;
        if (!rotulo.hidden) rotulo.textContent = `${Math.max(0, beneficio.restantes - usos)} após agendamentos`;
    }
}

function renderizarPerfil(perfil) {
    porId("perfil-titulo").textContent = perfil.cliente.nome;
    porId("perfil-celular").textContent = perfil.cliente.celular;
    const periodo = perfil.periodo;
    contexto.periodo = periodo;
    formulario.hidden = true;
    adicionar.hidden = Boolean(periodo?.ativo);
    adicionar.textContent = periodo ? "Renovar plano" : "Adicionar plano";

    if (!periodo) {
        dados.replaceChildren(elemento("p", "Este cliente ainda não tem um plano."));
        return;
    }

    const bloco = elemento("section", undefined, "perfil-plano");
    const cabecalho = elemento("div", undefined, "perfil-plano-topo");
    const status = periodo.ativo ? "Ativo" : "Vencido";
    cabecalho.append(elemento("h3", periodo.nomePlano),
        elemento("span", status, periodo.ativo ? "estado estado-ativo" : "estado"));
    const resumo = elemento("dl", undefined, "perfil-resumo");
    resumo.append(
        linhaResumo("Início", formatarData(periodo.inicio)),
        linhaResumo("Vencimento", formatarData(periodo.vencimento)),
        linhaResumo("Preço do período", moeda.format(periodo.precoPago)),
    );
    bloco.append(cabecalho, resumo);

    if (periodo.ativo) {
        const beneficios = elemento("ul", undefined, "perfil-beneficios");
        beneficios.setAttribute("aria-label", "Saldo de benefícios");
        for (const beneficio of periodo.beneficios) {
            const linha = elemento("li");
            const saldo = beneficio.restantes === 1 ? "1 restante" : `${beneficio.restantes} restantes`;
            const saldos = elemento("div", undefined, "perfil-saldos");
            const projecao = elemento("span", undefined, "perfil-projecao");
            projecao.dataset.projecaoServico = beneficio.servicoId;
            projecao.hidden = true;
            saldos.append(elemento("strong", saldo), projecao);
            linha.append(elemento("span", beneficio.servicoNome), saldos);
            beneficios.append(linha);
        }
        bloco.append(beneficios);
    }

    dados.replaceChildren(bloco);
    atualizarProjecaoBeneficios();
}

function listaAgendamentos(itens, atual) {
    const lista = elemento("ul", undefined, "perfil-agendamentos-lista");
    for (const item of itens) {
        const linha = elemento("li");
        const botao = elemento("button", undefined, "botao perfil-agendamento");
        botao.type = "button";
        botao.setAttribute("aria-haspopup", "dialog");
        botao.addEventListener("click", () => mostrarDetalhesAtendimento(item, {
            consulta: true, aoExpirarSessao: atual.aoExpirarSessao,
        }));
        const resumo = elemento("span");
        const data = formatarData(item.inicio.slice(0, 10));
        const horario = elemento("time", `${data} às ${item.inicio.slice(11, 16)}`);
        horario.dateTime = item.inicio;
        resumo.append(horario, elemento("span", `Barbeiro · ${item.barbeiroNome}`, "ajuda"),
            elemento("span", item.servicos.map((servico) => servico.nome).join(" · "), "ajuda"));
        botao.append(resumo, marcacaoAtendimento(item));
        linha.append(botao);
        lista.append(linha);
    }
    return lista;
}

async function carregarAgendamentos(atual) {
    agendamentos.setAttribute("aria-busy", "true");
    agendamentos.replaceChildren(elemento("p", "Carregando agendamentos…", "ajuda"));
    try {
        const itens = await api(`/agendamentos_cliente/${atual.clienteId}`);
        if (contexto !== atual) return;
        atual.agendamentos = itens;
        atualizarProjecaoBeneficios();
        const marcados = itens.filter((item) => item.status === "AGENDADO");
        const anteriores = itens.filter((item) => item.status !== "AGENDADO").reverse();
        agendamentos.replaceChildren(marcados.length ? listaAgendamentos(marcados, atual)
            : elemento("p", "Nenhum atendimento marcado.", "ajuda"));
        if (anteriores.length) {
            const historico = elemento("details", undefined, "perfil-agendamentos-historico");
            historico.append(elemento("summary", `Histórico (${anteriores.length})`), listaAgendamentos(anteriores, atual));
            agendamentos.append(historico);
        }
    } catch (erro) {
        if (contexto !== atual) return;
        if (erro.status === 401) atual.aoExpirarSessao(erro.message);
        else agendamentos.replaceChildren(elemento("p", "Não foi possível carregar os agendamentos.", "ajuda"));
    } finally {
        if (contexto === atual) agendamentos.setAttribute("aria-busy", "false");
    }
}

export async function abrirPerfilCliente(cliente, aoExpirarSessao) {
    if (dialogo.open) return;
    const atual = { clienteId: cliente.id, aoExpirarSessao, enviando: false };
    contexto = atual;
    porId("perfil-titulo").textContent = cliente.nome;
    porId("perfil-celular").textContent = cliente.celular;
    mensagem("perfil-erro");
    mensagem("perfil-aviso");
    dados.replaceChildren(elemento("p", "Carregando perfil…", "ajuda"));
    dados.setAttribute("aria-busy", "true");
    adicionar.hidden = true;
    adicionar.disabled = false;
    formulario.hidden = true;
    carregarAgendamentos(atual);
    dialogo.showModal();

    try {
        const perfil = await api(`/planos_cliente/${cliente.id}`);
        if (contexto === atual) renderizarPerfil(perfil);
    } catch (erro) {
        if (contexto === atual) dados.replaceChildren();
        tratarErro(erro, atual);
    } finally {
        if (contexto === atual) dados.setAttribute("aria-busy", "false");
    }
}

export function fecharPerfilCliente() {
    contexto = undefined;
    if (dialogo.open) dialogo.close();
}

adicionar.addEventListener("click", async () => {
    const atual = contexto;
    if (!atual || atual.periodo?.ativo) return;
    adicionar.disabled = true;
    mensagem("perfil-erro");
    mensagem("perfil-aviso");

    try {
        const planos = (await api("/planos")).filter((plano) => plano.ativo);
        if (contexto !== atual) return;
        if (!planos.length) {
            mensagem("perfil-erro", "Ative um plano no catálogo para poder contratá-lo.");
            return;
        }
        seletor.replaceChildren(new Option("Escolher plano", ""));
        for (const plano of planos) {
            seletor.add(new Option(`${plano.nome} · ${moeda.format(plano.precoMensal)}/mês`, plano.id));
        }

        const anterior = planos.find((plano) => plano.id === atual.periodo?.planoId);
        seletor.value = anterior ? String(anterior.id) : "";
        confirmar.textContent = atual.periodo ? "Confirmar renovação" : "Confirmar contratação";
        porId("perfil-ajuda").textContent = "O novo período começa hoje pelo preço vigente.";
        adicionar.hidden = true;
        formulario.hidden = false;
        seletor.focus();
    } catch (erro) {
        tratarErro(erro, atual);
    } finally {
        if (contexto === atual) adicionar.disabled = false;
    }
});

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const atual = contexto;
    if (!atual || atual.enviando || !seletor.value) return;
    atual.enviando = true;
    const renovacao = Boolean(atual.periodo);
    let concluiu = false;
    seletor.disabled = confirmar.disabled = porId("perfil-cancelar").disabled = porId("perfil-fechar").disabled = true;
    mensagem("perfil-erro");

    try {
        const perfil = await api("/cadastrar_plano_cliente", {
            metodo: "POST",
            dados: { clienteId: atual.clienteId, planoId: Number(seletor.value) },
        });
        if (contexto === atual) {
            renderizarPerfil(perfil);
            mensagem("perfil-aviso", renovacao ? "Plano renovado." : "Plano contratado.");
            concluiu = true;
        }
    } catch (erro) {
        tratarErro(erro, atual);
    } finally {
        atual.enviando = false;
        seletor.disabled = confirmar.disabled = porId("perfil-cancelar").disabled = porId("perfil-fechar").disabled = false;
        if (concluiu) porId("perfil-fechar").focus();
    }
});

porId("perfil-cancelar").addEventListener("click", () => {
    formulario.hidden = true;
    mensagem("perfil-erro");
    adicionar.hidden = false;
    adicionar.focus();
});
porId("perfil-fechar").addEventListener("click", fecharPerfilCliente);
dialogo.addEventListener("cancel", (evento) => {
    if (contexto?.enviando) evento.preventDefault();
    else contexto = undefined;
});
