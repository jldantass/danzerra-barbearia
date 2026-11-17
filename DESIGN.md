---
name: Danzerra
description: Painel web do balcão da barbearia.
colors:
  fundo: "#f4f8fb"
  lateral: "#113d56"
  superficie: "#ffffff"
  campo: "#ffffff"
  linha: "#c7dce6"
  texto: "#112c3e"
  suave: "#3d5b6d"
  azul: "#0b5875"
  sobre-azul: "#ffffff"
  azul-escuro: "#073246"
  azul-claro: "#d9f1fb"
  erro: "#9a2b35"
  sucesso: "#236341"
  pendente: "#815315"
typography:
  corpo:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
  titulo:
    fontFamily: "Old Standard TT, Georgia, Times New Roman, serif"
    fontSize: "3.45rem"
    letterSpacing: "-0.04em"
rounded:
  controle: "7px"
  registro: "5px"
  dialogo: "14px"
components:
  botao-primario:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.sobre-azul}"
    rounded: "{rounded.controle}"
    height: "2.4rem"
---
# Design System: Danzerra

## Overview

Painel de balcão que abre com a agenda e o movimento do dia. A Agenda exibe o planner de segunda a sábado, com atendimentos em ordem de horário. Os relatórios mostram valores tabulares com os serviços e despesas que os compõem.

## Colors

O azul oceano identifica a navegação e os cabeçalhos das tabelas. Uma fotografia de barbearia recebe tratamento monocromático azul no login. As superfícies brancas dão contraste aos campos e registros. O azul claro sinaliza a passagem do ponteiro pelas ações. Os estados de sucesso, pendência e erro têm rótulos visíveis. [Fotografia de Barney Goodman](https://unsplash.com/photos/an-empty-barbershop-interior-with-several-chairs-and-mirrors-AXurvQTtO3Y).

## Typography

Títulos e horários destacados usam serifa. Controles, rótulos e dados usam a família sem serifa, com números tabulares quando a leitura em coluna é importante.

## Layout

O login coloca o formulário à esquerda da fotografia. Em telas estreitas, a foto vira uma faixa acima do formulário. A navegação lateral acompanha a página no desktop. Hoje reúne a agenda e uma coluna de resumo. A partir de 660 px, a navegação vai para o topo e as seções de Hoje ficam em uma coluna. O catálogo empilha os registros e os relatórios conservam a leitura tabular.

## Components

A ação principal de cada seção abre seu formulário. O nome da barbearia na navegação abre sua edição. A busca de clientes filtra conforme a digitação. O cabeçalho da coluna de ações se alinha com seu primeiro botão. Mensagens de validação aparecem junto ao formulário, e os campos de senha oferecem um botão para controlar a visibilidade.
