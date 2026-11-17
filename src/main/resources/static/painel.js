import { api, limparCsrf } from "./api-painel.js";
import { abrirPerfilCliente, fecharPerfilCliente } from "./perfil-cliente.js";
import { abrirAcaoOperacional, mostrarOperacao, fecharOperacao } from "./operacao.js";

const porId = (id) => document.getElementById(id);
const editor = porId("editor");
const exclusao = porId("exclusao");
const resultados = porId("resultados");
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const clientesPorPagina = 20;

const secoes = {
    hoje: { titulo: "Hoje", descricao: "A agenda do dia e o movimento do balcão.", novo: "Agendar atendimento", operacional: true },
    agenda: { titulo: "Agenda", descricao: "Acompanhe os atendimentos da semana, de segunda a sábado.", novo: "Agendar atendimento", operacional: true },
    atendimentos: { titulo: "Atendimentos", descricao: "Acompanhe os serviços realizados e o movimento por período.", operacional: true },
    financeiro: { titulo: "Financeiro", descricao: "Consulte entradas, despesas e o resultado de caixa.", novo: "Registrar despesa", operacional: true },
    clientes: {
        titulo: "Clientes", descricao: "Cadastre e encontre quem passa pelo balcão.",
        registro: "Clientes cadastrados", novo: "Novo cliente", entidade: "cliente",
        colunas: ["Nome", "Celular", "Ações"],
    },
    servicos: {
        titulo: "Serviços", descricao: "Gerencie os serviços, os preços e a duração dos atendimentos.",
        registro: "Catálogo de serviços", novo: "Novo serviço", entidade: "servico",
        colunas: ["Serviço", "Preço avulso", "Duração", "Status", "Ações"],
    },
    planos: {
        titulo: "Planos", descricao: "Gerencie os preços e benefícios dos planos mensais.",
        registro: "Catálogo de planos", novo: "Novo plano", entidade: "plano",
        colunas: ["Plano", "Mensalidade", "Benefícios", "Status", "Ações"],
    },
};

let secao = "hoje";
let pagina = 0;
let busca = "";
let atrasoBusca;
let tempoAviso;
let requisicaoLista = 0;
let contextoEditor;
let contextoExclusao;

function elemento(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

function mensagem(id, texto = "", erro = false) {
    const node = porId(id);
    node.textContent = texto;
    node.hidden = !texto;
    if (id === "painel-aviso") {
        node.classList.toggle("erro", erro);
        clearTimeout(tempoAviso);
        if (texto) {
            tempoAviso = setTimeout(() => mensagem(id), erro ? 8000 : 5000);
        }
    }
}

function botao(texto, acao, classe = "discreto", rotulo) {
    const node = elemento("button", texto, `botao ${classe}`);
    node.type = "button";
    if (rotulo) node.setAttribute("aria-label", rotulo);
    node.addEventListener("click", () => acao(node));
    return node;
}

function mostrarLogin(texto = "") {
    document.title = "Entrar · Barbearia";
    requisicaoLista++;
    clearTimeout(atrasoBusca);
    limparCsrf();
    fecharPerfilCliente();
    fecharOperacao();
    for (const dialogo of [editor, exclusao]) {
        if (dialogo.open) dialogo.close();
    }
    resultados.replaceChildren();
    porId("usuario").textContent = "";
    porId("inicializando").hidden = true;
    porId("painel").hidden = true;
    porId("acesso").hidden = false;
    porId("login-form").reset();
    ocultarSenhaLogin();
    mensagem("login-erro", texto);
    porId("login-form").elements.login.focus();
}

function definirNomeBarbearia(nome) {
    const botaoNome = porId("nome-barbearia");
    botaoNome.textContent = nome;
    botaoNome.setAttribute("aria-label", `${nome} — editar nome da barbearia`);
    document.title = `${nome} · Painel`;
}

async function mostrarPainel(conta) {
    const barbearia = await api("/barbearia");
    definirNomeBarbearia(barbearia.nome);
    porId("usuario").textContent = conta.login;
    const data = new Date();
    porId("data").textContent = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long", day: "numeric", month: "long", timeZone: "America/Fortaleza",
    }).format(data);
    porId("data").dateTime = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "America/Fortaleza", dateStyle: "short",
    }).format(data);
    porId("inicializando").hidden = true;
    porId("acesso").hidden = true;
    porId("painel").hidden = false;
    pagina = 0;
    busca = "";
    porId("busca-texto").value = "";
    trocarSecao("hoje");
}

function tratarFalha(erro, destino = "painel-aviso") {
    if (erro.status === 401) {
        mostrarLogin(erro.message);
        return;
    }
    mensagem(destino, erro.message, true);
}

async function acaoComBotao(node, acao) {
    if (node.disabled) return;
    node.disabled = true;
    try {
        await acao();
    } finally {
        node.disabled = false;
    }
}

function trocarSecao(novaSecao, moverFoco = false) {
    clearTimeout(atrasoBusca);
    secao = novaSecao;
    const dados = secoes[secao];
    porId("secao-titulo").textContent = dados.titulo;
    porId("secao-descricao").textContent = dados.descricao;
    porId("registro-titulo").textContent = dados.registro ?? "";
    porId("novo").textContent = dados.novo ?? "";
    porId("novo").hidden = !dados.novo;
    porId("lista-catalogo").hidden = Boolean(dados.operacional);
    porId("operacao").hidden = !dados.operacional;
    porId("busca-clientes").hidden = secao !== "clientes";
    mensagem("painel-aviso");

    for (const item of document.querySelectorAll("[data-secao]")) {
        if (item.dataset.secao === secao) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
    }
    if (moverFoco) porId("secao-titulo").focus();
    if (dados.operacional) {
        requisicaoLista++;
        return mostrarOperacao(secao, mostrarLogin, mensagem);
    }
    return carregarLista();
}

function consultaLista(chave) {
    if (chave === "clientes") {
        const filtro = /^[+\d\s().-]+$/.test(busca) ? "celular" : "nome";
        const params = new URLSearchParams({ pagina, tamanho: clientesPorPagina, [filtro]: busca });
        return api(`/clientes?${params}`);
    }
    return api(chave === "servicos" ? "/servicos?incluirInativos=true" : "/planos");
}

async function carregarLista() {
    const chave = secao;
    const pedido = ++requisicaoLista;
    resultados.setAttribute("aria-busy", "true");
    resultados.replaceChildren(estadoLista("Carregando registros…"));
    porId("quantidade").textContent = "";
    porId("paginacao").hidden = true;

    try {
        const resposta = await consultaLista(chave);
        if (pedido !== requisicaoLista) return;

        if (chave === "clientes") {
            if (!resposta.clientes.length && resposta.total > 0 && pagina > 0) {
                pagina = Math.max(0, Math.ceil(resposta.total / clientesPorPagina) - 1);
                return carregarLista();
            }
            renderizarLista(chave, resposta.clientes, resposta.total);
            renderizarPaginacao(resposta);
        } else {
            renderizarLista(chave, resposta, resposta.length);
        }
    } catch (erro) {
        if (pedido !== requisicaoLista) return;
        if (erro.status === 401) return mostrarLogin(erro.message);
        resultados.replaceChildren(estadoLista("Não foi possível carregar", erro.message,
            botao("Tentar novamente", carregarLista, "secundario")));
    } finally {
        if (pedido === requisicaoLista) resultados.setAttribute("aria-busy", "false");
    }
}

function estadoLista(titulo, descricao, acao) {
    const node = elemento("div", undefined, "vazio");
    node.append(elemento("h3", titulo));
    if (descricao) node.append(elemento("p", descricao));
    if (acao) node.append(acao);
    return node;
}

function renderizarPaginacao(resposta) {
    const totalPaginas = Math.ceil(resposta.total / resposta.tamanho);
    if (totalPaginas <= 1) return;
    porId("paginacao").hidden = false;
    porId("pagina").textContent = `Página ${resposta.pagina + 1} de ${totalPaginas}`;
    porId("anterior").disabled = resposta.pagina === 0;
    porId("proxima").disabled = resposta.pagina + 1 >= totalPaginas;
}

function renderizarLista(chave, itens, total) {
    const info = secoes[chave];
    porId("quantidade").textContent = `${total} ${total === 1 ? "registro" : "registros"}`;
    if (!itens.length) {
        const temBusca = chave === "clientes" && busca !== "";
        const titulo = temBusca ? "Nenhum cliente encontrado" : "Nenhum registro cadastrado";
        const acao = temBusca
            ? botao("Limpar busca", limparBusca, "secundario")
            : botao(info.novo, () => abrirEditor(chave), "secundario");
        resultados.replaceChildren(estadoLista(titulo, temBusca ? "Tente outro nome ou celular." : "", acao));
        return;
    }

    const area = elemento("div", undefined, "tabela-area");
    area.tabIndex = 0;
    area.setAttribute("role", "region");
    area.setAttribute("aria-label", info.registro);
    const tabela = elemento("table");
    tabela.setAttribute("role", "table");
    const cabecalho = tabela.createTHead().insertRow();
    for (const titulo of info.colunas) {
        const th = elemento("th", titulo);
        th.scope = "col";
        cabecalho.append(th);
    }
    const corpo = tabela.createTBody();
    corpo.setAttribute("role", "rowgroup");
    for (const item of itens) {
        const linha = corpo.insertRow();
        linha.setAttribute("role", "row");
        renderizarLinha(linha, chave, item);
        for (const [indice, td] of Array.from(linha.cells).entries()) {
            td.dataset.coluna = info.colunas[indice];
            td.setAttribute("role", "cell");
        }
    }
    area.append(tabela);
    resultados.replaceChildren(area);
}

function celula(linha, conteudo, classe) {
    const td = linha.insertCell();
    if (classe) td.className = classe;
    if (conteudo instanceof Node) td.append(conteudo);
    else td.textContent = conteudo;
}

function estado(titulo, classe = "") {
    return elemento("span", titulo, `estado ${classe}`);
}

function preco(valor) {
    return valor === null ? "A definir" : moeda.format(valor);
}

function renderizarLinha(linha, chave, item) {
    const nome = chave === "clientes"
        ? botao(item.nome, () => abrirPerfilCliente(item, mostrarLogin), "nome-cliente", `Abrir perfil de ${item.nome}`)
        : item.nome;
    celula(linha, nome, "nome-registro");

    let planoIncompleto = false;
    if (chave === "clientes") {
        celula(linha, item.celular, "numero");
    } else if (chave === "servicos") {
        celula(linha, preco(item.precoAvulso), "numero");
        celula(linha, `${item.duracaoMinutos} min`, "numero");
        celula(linha, item.ativo ? estado("Ativo", "estado-ativo") : estado("Inativo"));
    } else {
        const pendencias = [];
        if (item.precoMensal === null) pendencias.push("Defina a mensalidade.");
        if (item.beneficios.some((b) => b.servicoId === null)) pendencias.push("Vincule os serviços.");
        planoIncompleto = pendencias.length > 0;
        celula(linha, preco(item.precoMensal), "numero");
        const lista = elemento("ul", undefined, "beneficios");
        for (const entrada of item.beneficios) {
            const rotulo = `${entrada.quantidade} × ${entrada.servicoNome}`;
            lista.append(elemento("li", entrada.servicoId === null ? `${rotulo} (pendente)` : rotulo));
        }
        celula(linha, lista);
        const status = elemento("div");
        status.append(item.ativo ? estado("Ativo", "estado-ativo")
            : planoIncompleto ? estado("Incompleto", "estado-pendente") : estado("Inativo"));
        if (planoIncompleto && !item.ativo) {
            status.append(elemento("p", pendencias.join(" "), "estado-detalhe"));
        }
        celula(linha, status);
    }

    const acoes = elemento("div", undefined, "acoes");
    acoes.append(botao("Editar", () => abrirEditor(chave, item), "discreto", `Editar ${item.nome}`));
    if (chave !== "clientes" && (item.ativo || !planoIncompleto)) {
        const rotulo = item.ativo ? "Desativar" : "Ativar";
        acoes.append(botao(rotulo, (node) => alternarAtivo(node, chave, item), "discreto", `${rotulo} ${item.nome}`));
    }
    acoes.append(botao("Apagar", () => abrirExclusao(chave, item), "discreto apagar", `Apagar ${item.nome}`));
    celula(linha, acoes);
}

async function alternarAtivo(node, chave, item) {
    await acaoComBotao(node, async () => {
        mensagem("painel-aviso");
        const entidade = secoes[chave].entidade;
        const dados = chave === "planos" ? { ativo: !item.ativo } : undefined;
        try {
            await api(`/onoff_${entidade}/${item.id}`, { metodo: "PUT", dados });
            if (secao === chave) {
                mensagem("painel-aviso", item.ativo ? "Registro desativado." : "Registro ativado.");
                await carregarLista();
            }
        } catch (erro) {
            tratarFalha(erro);
            if (erro.status === 403 && secao === chave) await carregarLista();
        }
    });
}

function limparBusca() {
    clearTimeout(atrasoBusca);
    busca = "";
    pagina = 0;
    porId("busca-texto").value = "";
    return carregarLista();
}

function campo(titulo, nome, atributos = {}, valor = "") {
    const label = elemento("label", titulo);
    const input = elemento("input");
    input.name = nome;
    Object.assign(input, atributos);
    input.value = valor ?? "";
    label.append(input);
    return label;
}

function instalarControleSenha(input, envoltorio) {
    const controle = porId("controle-senha").content.firstElementChild.cloneNode(true);
    const aberto = controle.querySelector("[data-olho-aberto]");
    const fechado = controle.querySelector("[data-olho-fechado]");
    controle.setAttribute("aria-controls", input.id);
    envoltorio.append(controle);

    function mostrar(estaVisivel) {
        input.type = estaVisivel ? "text" : "password";
        const titulo = estaVisivel ? "Ocultar senha" : "Mostrar senha";
        controle.setAttribute("aria-label", titulo);
        controle.title = titulo;
        aberto.toggleAttribute("hidden", estaVisivel);
        fechado.toggleAttribute("hidden", !estaVisivel);
    }

    controle.addEventListener("click", () => mostrar(input.type === "password"));
    return () => mostrar(false);
}

function campoSenhaAdministrador() {
    const grupo = elemento("div", undefined, "grupo-senha");
    const label = elemento("label", "Senha");
    const envoltorio = elemento("div", undefined, "campo-senha");
    const input = elemento("input");
    Object.assign(input, {
        id: "senha-admin", name: "senha", type: "password",
        required: true, autocomplete: "new-password", minLength: 15,
    });
    label.htmlFor = input.id;
    envoltorio.append(input);
    instalarControleSenha(input, envoltorio);
    grupo.append(label, envoltorio);
    return grupo;
}

function campoBeneficio(grupo, servicos, beneficio, mudou) {
    const linha = elemento("div", undefined, "beneficio-campo");
    const label = elemento("label", "Serviço");
    const select = elemento("select");
    select.name = "servicoId";
    const vinculo = beneficio?.servicoId;
    const placeholder = beneficio?.servicoNome && vinculo === null
        ? `Vincular ${beneficio.servicoNome}` : "Escolher serviço";
    select.append(new Option(placeholder, ""));
    for (const servico of servicos) {
        const nome = servico.ativo ? servico.nome : `${servico.nome} (inativo)`;
        select.append(new Option(nome, String(servico.id)));
    }
    select.value = vinculo == null ? "" : String(vinculo);
    label.append(select);
    const quantidade = campo("Quantidade", "quantidade",
        { type: "number", min: "1", max: "2147483647", step: "1", required: true },
        beneficio?.quantidade ?? 1);
    const apagar = botao("Remover", () => {
        linha.remove();
        mudou();
        grupo.querySelector("select")?.focus();
    }, "discreto");
    linha.addEventListener("input", mudou);
    linha.append(label, quantidade, apagar);
    grupo.append(linha);
}

function editorPlano(caixa, item, servicos, contexto) {
    caixa.append(campo("Preço mensal (R$)", "precoMensal",
        { type: "number", min: "0", max: "99999999.99", step: ".01" }, item?.precoMensal));
    const grupo = elemento("fieldset", undefined, "grupo-beneficios");
    const linhas = elemento("div", undefined, "linhas-beneficios");
    const mudou = () => { contexto.beneficiosAlterados = true; };
    const adicionar = botao("Adicionar benefício", () => {
        mudou();
        campoBeneficio(linhas, servicos, undefined, mudou);
        linhas.lastElementChild.querySelector("select").focus();
    }, "secundario");
    grupo.append(elemento("legend", "Benefícios"), linhas, adicionar);
    if (!servicos.length) {
        grupo.append(elemento("p", "Cadastre um serviço para poder vinculá-lo ao plano.", "ajuda"));
    } else if (item?.beneficios.some((beneficio) => beneficio.servicoId === null)) {
        grupo.append(elemento("p", "Escolha os serviços pendentes ao editar os benefícios.", "ajuda"));
    }
    for (const beneficio of item?.beneficios ?? [undefined]) {
        campoBeneficio(linhas, servicos, beneficio, mudou);
    }
    caixa.append(grupo);
}

async function abrirEditor(chave, itemInicial) {
    if (editor.open) return;
    mensagem("painel-aviso");
    mensagem("editor-erro");
    const caixa = porId("editor-campos");
    caixa.replaceChildren(elemento("p", "Carregando formulário…", "ajuda"));
    porId("editor-titulo").textContent = {
        clientes: itemInicial ? "Editar cliente" : "Novo cliente",
        servicos: itemInicial ? "Editar serviço" : "Novo serviço",
        planos: itemInicial ? "Editar plano" : "Novo plano",
        administrador: "Novo administrador",
        barbearia: "Editar nome da barbearia",
    }[chave];

    const contexto = { chave, item: itemInicial, beneficiosAlterados: false };
    contextoEditor = contexto;
    porId("salvar").disabled = true;
    editor.showModal();

    try {
        let item = itemInicial;
        let servicos;
        if (chave === "planos") {
            [servicos, item] = await Promise.all([
                api("/servicos?incluirInativos=true"),
                itemInicial ? api(`/planos/${itemInicial.id}`) : Promise.resolve(undefined),
            ]);
        } else if (chave === "clientes" && itemInicial) {
            item = await api(`/clientes/${itemInicial.id}`);
        } else if (chave === "barbearia") {
            item = await api("/barbearia");
        }
        if (contextoEditor !== contexto || !editor.open) return;
        contexto.item = item;
        caixa.replaceChildren();

        if (chave === "administrador") {
            caixa.append(campo("Usuário", "login", { required: true, autoComplete: "off", maxLength: 50 }));
            caixa.append(campoSenhaAdministrador());
            caixa.append(elemento("p", "Use pelo menos 15 caracteres.", "ajuda"));
        } else {
            const rotulo = chave === "barbearia" ? "Nome da barbearia" : "Nome";
            caixa.append(campo(rotulo, "nome", { required: true, maxLength: 120 }, item?.nome));
        }

        if (chave === "clientes") {
            caixa.append(campo("Celular", "celular", { type: "tel", required: true, autoComplete: "tel" }, item?.celular));
        } else if (chave === "servicos") {
            caixa.append(campo("Preço avulso (R$)", "precoAvulso",
                { type: "number", required: true, min: "0", max: "99999999.99", step: ".01" }, item?.precoAvulso));
            caixa.append(campo("Duração (minutos)", "duracaoMinutos",
                { type: "number", required: true, min: "1", max: "2147483647", step: "1" }, item?.duracaoMinutos));
        } else if (chave === "planos") {
            editorPlano(caixa, item, servicos, contexto);
        }

        porId("salvar").disabled = false;
        caixa.querySelector("input").focus();
    } catch (erro) {
        if (contextoEditor !== contexto || !editor.open) return;
        caixa.replaceChildren();
        tratarFalha(erro, "editor-erro");
    }
}

function dadosEditor(form, contexto) {
    const { chave, item, beneficiosAlterados } = contexto;
    const campos = new FormData(form);
    if (chave === "administrador") return { login: campos.get("login"), senha: campos.get("senha") };
    const dados = { nome: campos.get("nome") };
    if (chave === "clientes") dados.celular = campos.get("celular");
    if (chave === "servicos") {
        dados.precoAvulso = Number(campos.get("precoAvulso"));
        dados.duracaoMinutos = Number(campos.get("duracaoMinutos"));
    }
    if (chave === "planos") {
        const precoMensal = campos.get("precoMensal");
        dados.precoMensal = precoMensal === "" ? null : Number(precoMensal);
        if (!item || beneficiosAlterados) {
            const ids = campos.getAll("servicoId");
            const quantidades = campos.getAll("quantidade");
            if (!ids.length || ids.some((id) => id === "")) {
                throw new Error("Escolha um serviço em cada benefício e mantenha pelo menos um benefício.");
            }
            dados.beneficios = ids.map((id, i) => ({ servicoId: Number(id), quantidade: Number(quantidades[i]) }));
        }
    }
    return dados;
}

function abrirExclusao(chave, item) {
    contextoExclusao = { chave, item };
    porId("exclusao-titulo").textContent = `Apagar ${item.nome}?`;
    porId("exclusao-texto").textContent = "O registro será removido do sistema.";
    mensagem("exclusao-erro");
    exclusao.showModal();
}

function dialogoOcupado(dialogo, ocupado) {
    dialogo.setAttribute("aria-busy", String(ocupado));
    for (const node of dialogo.querySelectorAll("button")) node.disabled = ocupado;
}

for (const dialogo of [editor, exclusao]) {
    dialogo.addEventListener("cancel", (evento) => {
        if (dialogo.getAttribute("aria-busy") === "true") evento.preventDefault();
    });
}

editor.addEventListener("close", () => {
    contextoEditor = undefined;
    porId("editor-campos").replaceChildren();
});

for (const node of document.querySelectorAll("[data-fechar]")) {
    node.addEventListener("click", () => porId(node.dataset.fechar).close());
}

porId("editor-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!contextoEditor || porId("salvar").disabled) return;
    const form = evento.currentTarget;
    const contexto = contextoEditor;
    const { chave, item } = contexto;
    const entidade = secoes[chave]?.entidade ?? "administrador";
    mensagem("editor-erro");
    dialogoOcupado(editor, true);

    try {
        const dados = dadosEditor(form, contexto);
        const caminho = chave === "barbearia" ? "/atualizar_barbearia"
            : item ? `/atualizar_${entidade}/${item.id}` : `/cadastrar_${entidade}`;
        const resposta = await api(caminho, { metodo: item ? "PUT" : "POST", dados });
        if (chave === "barbearia") definirNomeBarbearia(resposta.nome);
        editor.close();
        mensagem("painel-aviso", item ? "Alterações salvas." : "Cadastro concluído.");
        if (chave === secao) await carregarLista();
    } catch (erro) {
        tratarFalha(erro, "editor-erro");
    } finally {
        dialogoOcupado(editor, false);
    }
});

porId("exclusao-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (exclusao.getAttribute("aria-busy") === "true") return;
    const { chave, item } = contextoExclusao;
    mensagem("exclusao-erro");
    dialogoOcupado(exclusao, true);
    try {
        await api(`/apagar_${secoes[chave].entidade}/${item.id}`, { metodo: "DELETE" });
        exclusao.close();
        mensagem("painel-aviso", "Registro apagado.");
        if (secao === chave) await carregarLista();
    } catch (erro) {
        tratarFalha(erro, "exclusao-erro");
    } finally {
        dialogoOcupado(exclusao, false);
    }
});

porId("login-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const form = evento.currentTarget;
    const dados = Object.fromEntries(new FormData(form));
    await acaoComBotao(form.querySelector('button[type="submit"]'), async () => {
        mensagem("login-erro");
        try {
            await api("/auth/login", { metodo: "POST", dados, formulario: true });
            limparCsrf();
            await mostrarPainel(await api("/auth/me"));
            form.reset();
        } catch (erro) {
            mensagem("login-erro", erro.status === 401 ? "Usuário ou senha inválidos." : erro.message);
            ocultarSenhaLogin();
            form.elements.senha.value = "";
            form.elements.senha.focus();
        }
    });
});

porId("sair").addEventListener("click", (evento) => acaoComBotao(evento.currentTarget, async () => {
    try {
        await api("/auth/logout", { metodo: "POST" });
        mostrarLogin();
    } catch (erro) {
        tratarFalha(erro);
    }
}));

for (const node of document.querySelectorAll("[data-secao]")) {
    node.addEventListener("click", () => trocarSecao(node.dataset.secao, true));
}
porId("novo").addEventListener("click", () => {
    if (secoes[secao].operacional) abrirAcaoOperacional(secao);
    else abrirEditor(secao);
});
porId("novo-admin").addEventListener("click", () => abrirEditor("administrador"));
porId("nome-barbearia").addEventListener("click", () => abrirEditor("barbearia"));
porId("busca-texto").addEventListener("input", (evento) => {
    const termo = evento.currentTarget.value.trim();
    if (!termo) return limparBusca();
    if (termo === busca) return;

    clearTimeout(atrasoBusca);
    busca = termo;
    pagina = 0;
    requisicaoLista++;
    porId("paginacao").hidden = true;
    atrasoBusca = setTimeout(carregarLista, 250);
});
porId("anterior").addEventListener("click", () => {
    pagina--;
    carregarLista();
});
porId("proxima").addEventListener("click", () => {
    pagina++;
    carregarLista();
});

const senhaLogin = porId("senha-login");
const ocultarSenhaLogin = instalarControleSenha(senhaLogin, senhaLogin.parentElement);

try {
    await mostrarPainel(await api("/auth/me"));
} catch (erro) {
    mostrarLogin(erro.status === 401 ? "" : erro.message);
}
