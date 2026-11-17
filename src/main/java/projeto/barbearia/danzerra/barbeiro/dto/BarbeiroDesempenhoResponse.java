package projeto.barbearia.danzerra.barbeiro.dto;

import java.time.LocalDate;
import java.util.List;

public record BarbeiroDesempenhoResponse(LocalDate inicio, LocalDate fim, List<Desempenho> barbeiros) {

    public record Desempenho(Long id, String nome, boolean ativo, long agendamentos, long concluidos) {
    }
}
