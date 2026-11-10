package projeto.barbearia.danzerra.administrador.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.administrador.dto.AdministradorCadastroRequest;
import projeto.barbearia.danzerra.administrador.service.AdministradorService;

@RestController
@RequestMapping("/api/cadastro")
public class AdministradorCadastroController {

    private final AdministradorService administradores;

    public AdministradorCadastroController(AdministradorService administradores) {
        this.administradores = administradores;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void cadastrar(@RequestBody AdministradorCadastroRequest dados) {
        administradores.cadastrar(dados.login(), dados.senha());
    }
}