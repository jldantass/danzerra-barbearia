package projeto.barbearia.danzerra.relatorio;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.relatorio.RelatorioDados.Despesa;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Dia;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Periodo;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Resumo;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Servico;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Totais;

@Service
public class RelatorioService {

    private final JdbcTemplate banco;

    public RelatorioService(JdbcTemplate banco) {
        this.banco = banco;
    }

    @Transactional(readOnly = true)
    public Resumo consultar(LocalDate dia, Periodo periodo) {
        LocalDate inicio = switch (periodo) {
            case DIA -> dia;
            case SEMANA -> dia.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MES -> dia.withDayOfMonth(1);
        };
        LocalDate fim = switch (periodo) {
            case DIA -> inicio.plusDays(1);
            case SEMANA -> inicio.plusWeeks(1);
            case MES -> inicio.plusMonths(1);
        };
        List<Dia> dias = banco.query("""
                WITH datas AS (
                    SELECT CAST(d AS date) dia FROM generate_series(CAST(? AS date), CAST(? AS date) - 1, interval '1 day') d
                ), avulsos AS (
                    SELECT CAST(a.concluido_em AS date) dia, SUM(s.valor_cobrado) total
                    FROM atendimentos a JOIN atendimento_servicos s ON s.atendimento_id = a.id
                    WHERE a.concluido_em >= ? AND a.concluido_em < ? GROUP BY 1
                ), concluidos AS (
                    SELECT CAST(concluido_em AS date) dia, COUNT(*) quantidade FROM atendimentos
                    WHERE concluido_em >= ? AND concluido_em < ? GROUP BY 1
                ), planos AS (
                    SELECT inicio dia, SUM(preco_pago) total FROM planos_cliente WHERE inicio >= ? AND inicio < ? GROUP BY 1
                ), despesas AS (
                    SELECT dia, SUM(valor) total FROM despesas WHERE dia >= ? AND dia < ? GROUP BY 1
                )
                SELECT datas.dia, COALESCE(concluidos.quantidade, 0) concluidos,
                       COALESCE(avulsos.total, 0) avulsos, COALESCE(planos.total, 0) planos, COALESCE(despesas.total, 0) despesas
                FROM datas LEFT JOIN avulsos USING (dia) LEFT JOIN concluidos USING (dia)
                LEFT JOIN planos USING (dia) LEFT JOIN despesas USING (dia) ORDER BY datas.dia
                """, (rs, row) -> new Dia(rs.getObject("dia", LocalDate.class), rs.getLong("concluidos"),
                rs.getBigDecimal("avulsos"), rs.getBigDecimal("planos"), rs.getBigDecimal("despesas")),
                inicio, fim, inicio.atStartOfDay(), fim.atStartOfDay(), inicio.atStartOfDay(), fim.atStartOfDay(),
                inicio, fim, inicio, fim);

        BigDecimal avulsos = dias.stream().map(Dia::avulsos).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal planos = dias.stream().map(Dia::planos).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal despesas = dias.stream().map(Dia::despesas).reduce(BigDecimal.ZERO, BigDecimal::add);
        Totais totais = banco.queryForObject("""
                SELECT COUNT(*) FILTER (WHERE status = 'AGENDADO') agendados,
                       COUNT(*) FILTER (WHERE status = 'CANCELADO') cancelados,
                       COUNT(*) FILTER (WHERE status = 'FALTOU') faltas
                FROM atendimentos WHERE inicio >= ? AND inicio < ?
                """, (rs, row) -> new Totais(rs.getLong("agendados"), dias.stream().mapToLong(Dia::concluidos).sum(),
                rs.getLong("cancelados"), rs.getLong("faltas"), avulsos, planos, despesas,
                avulsos.add(planos).subtract(despesas)), inicio.atStartOfDay(), fim.atStartOfDay());

        List<Servico> servicos = banco.query("""
                SELECT catalogo.nome, COUNT(*) quantidade, COUNT(*) FILTER (WHERE s.coberto_por_plano) cobertos
                FROM atendimento_servicos s JOIN atendimentos a ON a.id = s.atendimento_id
                JOIN servicos catalogo ON catalogo.id = s.servico_id
                WHERE a.concluido_em >= ? AND a.concluido_em < ?
                GROUP BY catalogo.id, catalogo.nome ORDER BY quantidade DESC, catalogo.nome
                """, (rs, row) -> new Servico(rs.getString("nome"), rs.getLong("quantidade"), rs.getLong("cobertos")),
                inicio.atStartOfDay(), fim.atStartOfDay());
        List<Despesa> itens = banco.query("""
                SELECT dia, descricao, valor FROM despesas WHERE dia >= ? AND dia < ? ORDER BY dia DESC, id DESC
                """, (rs, row) -> new Despesa(rs.getObject("dia", LocalDate.class), rs.getString("descricao"),
                rs.getBigDecimal("valor")), inicio, fim);
        return new Resumo(inicio, fim.minusDays(1), totais, dias, servicos, itens);
    }

    public void cadastrarDespesa(Despesa despesa) {
        banco.update("INSERT INTO despesas (dia, descricao, valor) VALUES (?, ?, ?)",
                despesa.dia(), despesa.descricao().strip(), despesa.valor());
    }
}
