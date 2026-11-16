package projeto.barbearia.danzerra.servico.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.servico.service.ServicoService;

@RestController
@RequestMapping("/api/onoff_servico")
public class ServicoOnOffController {

    private final ServicoService servicos;

    public ServicoOnOffController(ServicoService servicos) {
        this.servicos = servicos;
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alternarAtivo(@PathVariable Long id) {
        servicos.alternarAtivo(id);
    }
}
