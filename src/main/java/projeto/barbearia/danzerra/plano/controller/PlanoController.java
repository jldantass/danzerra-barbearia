package projeto.barbearia.danzerra.plano.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.plano.dto.PlanoAtivoRequest;
import projeto.barbearia.danzerra.plano.dto.PlanoDadosRequest;
import projeto.barbearia.danzerra.plano.dto.PlanoResponse;
import projeto.barbearia.danzerra.plano.service.PlanoService;

@RestController
@RequestMapping("/api")
public class PlanoController {

    private final PlanoService planos;

    public PlanoController(PlanoService planos) {
        this.planos = planos;
    }

    @PostMapping("/cadastrar_plano")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanoResponse cadastrar(@Valid @RequestBody PlanoDadosRequest dados) {
        return planos.cadastrar(dados);
    }

    @GetMapping("/planos")
    public List<PlanoResponse> listar() {
        return planos.listar();
    }

    @GetMapping("/planos/{id}")
    public PlanoResponse consultar(@PathVariable Long id) {
        return planos.consultar(id);
    }

    @PutMapping("/atualizar_plano/{id}")
    public PlanoResponse atualizar(
            @PathVariable Long id, @Valid @RequestBody PlanoDadosRequest dados) {
        return planos.atualizar(id, dados);
    }

    @PutMapping("/onoff_plano/{id}")
    public PlanoResponse definirAtivo(
            @PathVariable Long id, @Valid @RequestBody PlanoAtivoRequest dados) {
        return planos.definirAtivo(id, dados.ativo());
    }

    @DeleteMapping("/apagar_plano/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        planos.remover(id);
    }
}
