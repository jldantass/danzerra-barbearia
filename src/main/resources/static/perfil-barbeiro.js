import { api } from "./api-painel.js";
import { marcacaoAtendimento, mostrarDetalhesAtendimento } from "./operacao.js";

const porId = (id) => document.getElementById(id);
const dialogo = porId("perfil-barbeiro");
const agendamentos = porId("barbeiro-perfil-agendamentos");
const dataBr = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
let contexto;

function elemento(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

export async function abrirPerfilBarbeiro(barbeiro, aoExpirarSessao) {
    if (dialogo.open) return;
    const atual = { barbeiroId: barbeiro.id, aoExpirarSessao };
    contexto = atual;
    porId("barbeiro-perfil-titulo").textContent = barbeiro.nome;
    porId("barbeiro-perfil-contato").textContent = barbeiro.celular || "Celular não informado";
    porId("barbeiro-perfil-status").replaceChildren();
    dialogo.showModal();
    await carregarPerfil(atual);
}

async function carregarPerfil(atual) {
    agendamentos.setAttribute("aria-busy", "true");
    agendamentos.replaceChildren(elemento("p", "Carregando agendamentos…", "ajuda"));
    try {
        const [barbeiro, itens] = await Promise.all([
            api(`/barbeiros/${atual.barbeiroId}`),
            api(`/agendamentos_barbeiro/${atual.barbeiroId}`),
        ]);
        if (contexto !== atual) return;
        porId("barbeiro-perfil-titulo").textContent = barbeiro.nome;
        porId("barbeiro-perfil-contato").textContent = barbeiro.celular || "Celular não informado";
        porId("barbeiro-perfil-status").replaceChildren(
            elemento("span", barbeiro.ativo ? "Ativo" : "Inativo", barbeiro.ativo ? "estado estado-ativo" : "estado"));
        if (!itens.length) {
            agendamentos.replaceChildren(elemento("p", "Nenhum atendimento agendado para este barbeiro.", "ajuda"));
            return;
        }
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
            const data = dataBr.format(new Date(`${item.inicio.slice(0, 10)}T00:00:00Z`));
            const horario = elemento("time", `${data} · ${item.inicio.slice(11, 16)}–${item.fim.slice(11, 16)}`);
            horario.dateTime = item.inicio;
            resumo.append(horario, elemento("strong", item.clienteNome),
                elemento("span", item.servicos.map((servico) => servico.nome).join(" · "), "ajuda"));
            botao.append(resumo, marcacaoAtendimento(item));
            linha.append(botao);
            lista.append(linha);
        }
        agendamentos.replaceChildren(lista);
    } catch (erro) {
        if (contexto !== atual) return;
        if (erro.status === 401) return atual.aoExpirarSessao(erro.message);
        const mensagem = elemento("p", erro.message, "ajuda");
        mensagem.setAttribute("role", "alert");
        const tentar = elemento("button", "Tentar novamente", "botao secundario");
        tentar.type = "button";
        tentar.addEventListener("click", () => carregarPerfil(atual));
        agendamentos.replaceChildren(mensagem, tentar);
    } finally {
        if (contexto === atual) agendamentos.setAttribute("aria-busy", "false");
    }
}

export function fecharPerfilBarbeiro() {
    contexto = undefined;
    dialogo.close();
}

porId("barbeiro-perfil-fechar").addEventListener("click", fecharPerfilBarbeiro);
dialogo.addEventListener("close", () => {
    contexto = undefined;
    agendamentos.replaceChildren();
});
