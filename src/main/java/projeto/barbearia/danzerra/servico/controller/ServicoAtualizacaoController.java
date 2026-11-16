package projeto.barbearia.danzerra.servico.controller;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.servico.dto.ServicoAtualizacaoRequest;
import projeto.barbearia.danzerra.servico.dto.ServicoResponse;
import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api/atualizar_servico")
public class ServicoAtualizacaoController {

    private final ServicoService servicos;

    public ServicoAtualizacaoController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ServicoAtualizacaoRequest dados) {
        return servicos.atualizar(id, dados);
    }
}
