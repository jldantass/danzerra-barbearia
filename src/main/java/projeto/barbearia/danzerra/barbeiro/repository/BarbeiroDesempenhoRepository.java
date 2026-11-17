package projeto.barbearia.danzerra.barbeiro.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroDesempenhoResponse.Desempenho;

@Repository
public class BarbeiroDesempenhoRepository {

    private final JdbcTemplate banco;

    public BarbeiroDesempenhoRepository(JdbcTemplate banco) {
        this.banco = banco;
    }

    public List<Desempenho> consultar(LocalDate inicio, LocalDate fimExclusivo) {
        return banco.query("""
                SELECT b.id, b.nome, b.ativo,
                       COUNT(a.id) FILTER (
                           WHERE a.status <> 'CANCELADO' AND a.inicio >= ? AND a.inicio < ?
                       ) AS agendamentos,
                       COUNT(a.id) FILTER (
                           WHERE a.status = 'CONCLUIDO' AND a.concluido_em >= ? AND a.concluido_em < ?
                       ) AS concluidos
                FROM barbeiros b
                LEFT JOIN atendimentos a ON a.barbeiro_id = b.id
                    AND ((a.inicio >= ? AND a.inicio < ?) OR (a.concluido_em >= ? AND a.concluido_em < ?))
                GROUP BY b.id, b.nome, b.ativo
                ORDER BY agendamentos DESC, concluidos DESC, b.nome, b.id
                """, (rs, linha) -> new Desempenho(rs.getLong("id"), rs.getString("nome"),
                        rs.getBoolean("ativo"), rs.getLong("agendamentos"), rs.getLong("concluidos")),
                inicio.atStartOfDay(), fimExclusivo.atStartOfDay(),
                inicio.atStartOfDay(), fimExclusivo.atStartOfDay(),
                inicio.atStartOfDay(), fimExclusivo.atStartOfDay(),
                inicio.atStartOfDay(), fimExclusivo.atStartOfDay());
    }
}
