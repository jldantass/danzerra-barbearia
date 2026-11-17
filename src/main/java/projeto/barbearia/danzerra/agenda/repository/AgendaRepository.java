package projeto.barbearia.danzerra.agenda.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Atendimento;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Item;
import projeto.barbearia.danzerra.agenda.dto.AgendaDados.Status;

@Repository
public class AgendaRepository {

    private final JdbcTemplate banco;

    public AgendaRepository(JdbcTemplate banco) {
        this.banco = banco;
    }

    public void bloquearAgenda() {
        banco.queryForObject("SELECT id FROM barbearia_configuracao WHERE id = 1 FOR UPDATE", Integer.class);
    }

    public List<Atendimento> listar(LocalDate inicio, LocalDate fimExclusivo) {
        return consultar("a.inicio >= ? AND a.inicio < ?", inicio.atStartOfDay(), fimExclusivo.atStartOfDay());
    }

    public List<Atendimento> listarPorCliente(long clienteId) {
        return consultar("a.cliente_id = ?", clienteId);
    }

    public Optional<Atendimento> buscar(long id) {
        return consultar("a.id = ?", id).stream().findFirst();
    }

    private List<Atendimento> consultar(String filtro, Object... argumentos) {
        return banco.query("""
                SELECT a.id, a.inicio, a.fim, a.status, c.id AS cliente_id, c.nome AS cliente,
                       s.servico_id, s.nome, s.duracao_minutos, s.preco_avulso, s.corte,
                       s.valor_cobrado, s.coberto_por_plano
                FROM atendimentos a JOIN clientes c ON c.id = a.cliente_id
                JOIN atendimento_servicos s ON s.atendimento_id = a.id
                WHERE %s
                ORDER BY a.inicio, a.id, s.servico_id
                """.formatted(filtro), rs -> {
            Map<Long, Atendimento> agrupados = new LinkedHashMap<>();
            while (rs.next()) {
                long atendimentoId = rs.getLong("id");
                Atendimento atendimento = agrupados.get(atendimentoId);
                if (atendimento == null) {
                    atendimento = new Atendimento(atendimentoId, rs.getLong("cliente_id"),
                            rs.getString("cliente"), rs.getObject("inicio", LocalDateTime.class),
                            rs.getObject("fim", LocalDateTime.class), Status.valueOf(rs.getString("status")),
                            new ArrayList<>());
                    agrupados.put(atendimentoId, atendimento);
                }
                atendimento.servicos().add(new Item(rs.getLong("servico_id"), rs.getString("nome"),
                        rs.getBigDecimal("preco_avulso"), rs.getInt("duracao_minutos"), rs.getBoolean("corte"),
                        rs.getBigDecimal("valor_cobrado"), rs.getObject("coberto_por_plano", Boolean.class)));
            }
            return List.copyOf(agrupados.values());
        }, argumentos);
    }

    public boolean clienteExiste(Long clienteId) {
        return Boolean.TRUE.equals(banco.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM clientes WHERE id = ? FOR KEY SHARE)", Boolean.class, clienteId));
    }

    public List<Item> buscarServicos(Long[] ids, boolean bloquear) {
        return banco.query("""
                SELECT id, nome, preco_avulso, duracao_minutos
                FROM servicos WHERE ativo AND id = ANY(?)
                ORDER BY id
                """ + (bloquear ? " FOR SHARE" : ""), ps -> ps.setArray(1, ps.getConnection().createArrayOf("bigint", ids)),
                (rs, row) -> new Item(rs.getLong("id"), rs.getString("nome"), rs.getBigDecimal("preco_avulso"),
                        rs.getInt("duracao_minutos"), ehCorte(rs.getString("nome")), null, null));
    }

    private static boolean ehCorte(String nome) {
        return nome.equalsIgnoreCase("Corte") || nome.equalsIgnoreCase("Corte de Cabelo");
    }

    public boolean horarioOcupado(LocalDateTime inicio, LocalDateTime fim, long ignorarId) {
        return Boolean.TRUE.equals(banco.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM atendimentos
                WHERE status IN ('AGENDADO', 'CONCLUIDO') AND id <> ? AND inicio < ? AND fim > ?)
                """, Boolean.class, ignorarId, fim, inicio));
    }

    public boolean temCorteAgendadoNoDia(long clienteId, LocalDate dia, long ignorarId) {
        return Boolean.TRUE.equals(banco.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM atendimentos a JOIN atendimento_servicos s ON s.atendimento_id = a.id
                    WHERE a.cliente_id = ? AND a.status = 'AGENDADO' AND s.corte
                        AND a.inicio >= ? AND a.inicio < ? AND a.id <> ?
                )
                """, Boolean.class, clienteId, dia.atStartOfDay(), dia.plusDays(1).atStartOfDay(), ignorarId));
    }

    public Long cadastrar(Long clienteId, LocalDateTime inicio, LocalDateTime fim, List<Item> servicos) {
        Long id = banco.queryForObject("""
                INSERT INTO atendimentos (cliente_id, inicio, fim) VALUES (?, ?, ?) RETURNING id
                """, Long.class, clienteId, inicio, fim);
        for (Item item : servicos) {
            banco.update("""
                    INSERT INTO atendimento_servicos
                    (atendimento_id, servico_id, nome, preco_avulso, duracao_minutos, corte)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """, id, item.servicoId(), item.nome(), item.precoAvulso(), item.duracaoMinutos(), item.corte());
        }
        return id;
    }

    public void remarcar(long id, LocalDateTime inicio, LocalDateTime fim) {
        banco.update("UPDATE atendimentos SET inicio = ?, fim = ? WHERE id = ?", inicio, fim, id);
    }

    public Long buscarPeriodo(long cliente, LocalDate dia) {
        return banco.query("""
                SELECT id FROM planos_cliente WHERE cliente_id = ? AND inicio <= ? AND vencimento >= ?
                ORDER BY inicio DESC LIMIT 1
                """, rs -> rs.next() ? rs.getLong(1) : null, cliente, dia, dia);
    }

    public void bloquearPlanoDoPeriodo(long periodo) {
        banco.queryForObject("""
                SELECT p.id FROM planos p JOIN planos_cliente c ON c.plano_id = p.id
                WHERE c.id = ? FOR UPDATE OF p
                """, Long.class, periodo);
    }

    public void registrarItemConcluido(long id, Item item, Long periodo) {
        boolean coberto = periodo != null && banco.update("""
                UPDATE planos_cliente_beneficios SET usados = usados + 1
                WHERE periodo_id = ? AND servico_id = ? AND usados < cota
                """, periodo, item.servicoId()) == 1;
        banco.update("""
                UPDATE atendimento_servicos SET coberto_por_plano = ?, valor_cobrado = ?
                WHERE atendimento_id = ? AND servico_id = ?
                """, coberto, coberto ? BigDecimal.ZERO : item.precoAvulso(), id, item.servicoId());
    }

    public void mudarStatus(long id, Status status, LocalDateTime concluidoEm) {
        banco.update("UPDATE atendimentos SET status = ?, concluido_em = ? WHERE id = ?",
                status.name(), concluidoEm, id);
    }
}
