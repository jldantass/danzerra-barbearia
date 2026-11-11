package projeto.barbearia.danzerra.cliente.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.cliente.dto.ClienteAtualizacaoRequest;
import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.service.ClienteService;

@RestController
@RequestMapping("/api/clientes")
public class ClienteAtualizacaoController {

    private final ClienteService clientes;

    public ClienteAtualizacaoController(ClienteService clientes) {
        this.clientes = clientes;
    }

    @PutMapping("/{id}")
    public ClienteResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ClienteAtualizacaoRequest dados) {
        return clientes.atualizar(id, dados);
    }
}