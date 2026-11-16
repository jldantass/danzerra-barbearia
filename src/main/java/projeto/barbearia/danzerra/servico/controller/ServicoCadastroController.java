package projeto.barbearia.danzerra.servico.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.servico.dto.ServicoCadastroRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api/cadastrar_servico")
public class ServicoCadastroController {

    private final ServicoService servicos;

    public ServicoCadastroController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServicoResponse cadastrar(@Valid @RequestBody ServicoCadastroRequest dados) {
        return servicos.cadastrar(dados);
    }
}
