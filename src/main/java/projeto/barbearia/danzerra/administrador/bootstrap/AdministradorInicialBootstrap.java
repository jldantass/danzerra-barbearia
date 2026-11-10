package projeto.barbearia.danzerra.administrador.bootstrap;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.administrador.repository.AdministradorRepository;
import projeto.barbearia.danzerra.administrador.service.AdministradorService;

@Component
@ConditionalOnProperty(name = "danzerra.admin.inicial.habilitado", havingValue = "true")
public class AdministradorInicialBootstrap implements ApplicationRunner {

    private final JdbcTemplate banco;
    private final AdministradorRepository administradores;
    private final AdministradorService service;
    private final Environment ambiente;

    public AdministradorInicialBootstrap(JdbcTemplate banco,
                                AdministradorRepository administradores,
                                AdministradorService service,
                                Environment ambiente) {
        this.banco = banco;
        this.administradores = administradores;
        this.service = service;
        this.ambiente = ambiente;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        banco.execute("LOCK TABLE administradores IN SHARE ROW EXCLUSIVE MODE");

        if (administradores.count() > 0) {
            return;
        }

        String login = ambiente.getRequiredProperty("danzerra.admin.inicial.login");
        String senha = ambiente.getRequiredProperty("danzerra.admin.inicial.senha");
        service.cadastrar(login, senha);
    }
}