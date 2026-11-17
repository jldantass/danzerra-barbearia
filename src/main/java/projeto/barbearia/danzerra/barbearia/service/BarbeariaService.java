package projeto.barbearia.danzerra.barbearia.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import projeto.barbearia.danzerra.barbearia.dto.BarbeariaDados;

@Service
public class BarbeariaService {

    private final JdbcTemplate banco;

    public BarbeariaService(JdbcTemplate banco) {
        this.banco = banco;
    }

    public BarbeariaDados consultar() {
        String nome = banco.queryForObject(
                "SELECT nome FROM barbearia_configuracao WHERE id = 1", String.class);
        return new BarbeariaDados(nome);
    }

    public BarbeariaDados atualizar(BarbeariaDados dados) {
        String nome = banco.queryForObject(
                "UPDATE barbearia_configuracao SET nome = ? WHERE id = 1 RETURNING nome",
                String.class, dados.nome().strip());
        return new BarbeariaDados(nome);
    }
}
