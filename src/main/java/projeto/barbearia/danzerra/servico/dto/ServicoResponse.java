package projeto.barbearia.danzerra.servico.dto;

import java.math.BigDecimal;

public record ServicoResponse(Long id, String nome, BigDecimal precoAvulso, int duracaoMinutos, boolean ativo) {
}
