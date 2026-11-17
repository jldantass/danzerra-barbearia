let csrf;

export class FalhaApi extends Error {
    constructor(status, resposta) {
        const campos = Object.values(resposta?.erros ?? {}).filter(Boolean);
        const padrao = {
            400: "Confira os dados preenchidos.",
            401: "Sua sessão expirou. Entre novamente.",
            403: "A operação foi recusada. Confira sua sessão e tente novamente.",
            404: "O registro solicitado não foi encontrado.",
            409: "O registro está vinculado a outros dados.",
        };
        super([resposta?.detail ?? padrao[status] ?? "O servidor não conseguiu concluir a operação.", ...campos]
            .join(" "));
        this.status = status;
    }
}

export function limparCsrf() {
    csrf = undefined;
}

export async function api(caminho, { metodo = "GET", dados, formulario } = {}) {
    const headers = new Headers({ Accept: "application/json" });

    if (metodo !== "GET") {
        csrf ??= await api("/auth/csrf");
        headers.set(csrf.headerName, csrf.token);
    }

    let body;
    if (formulario) {
        body = new URLSearchParams(dados);
    } else if (dados !== undefined) {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(dados);
    }

    let resposta;
    try {
        resposta = await fetch(`/api${caminho}`, {
            method: metodo,
            credentials: "same-origin",
            cache: "no-store",
            headers,
            body,
        });
    } catch {
        throw new Error("Não foi possível conectar à API. Confira se o Danzerra está rodando.");
    }

    if (resposta.status === 204) return undefined;
    const conteudo = resposta.headers.get("Content-Type") ?? "";
    const dadosResposta = conteudo.includes("json") ? await resposta.json() : undefined;

    if (!resposta.ok) {
        if (resposta.status === 401 || resposta.status === 403) limparCsrf();
        throw new FalhaApi(resposta.status, dadosResposta);
    }
    return dadosResposta;
}
