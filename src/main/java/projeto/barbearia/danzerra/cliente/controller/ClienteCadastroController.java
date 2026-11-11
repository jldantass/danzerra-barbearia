package projeto.barbearia.danzerra.cliente.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.dto.ClienteCadastroRequest;
import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.service.ClienteService;

@RestController
@RequestMapping("/api/clientes")
public class ClienteCadastroController {

    private final ClienteService clientes;

    public ClienteCadastroController(ClienteService clientes) {
        this.clientes = clientes;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResponse cadastrar(@Valid @RequestBody ClienteCadastroRequest dados) {
        return clientes.cadastrar(dados);
    }
}