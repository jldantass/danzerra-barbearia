package projeto.barbearia.danzerra.barbeiro.controller;

import java.time.LocalDate;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroRequest;
import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroDesempenhoResponse;
import projeto.barbearia.danzerra.barbeiro.dto.BarbeiroResponse;
import projeto.barbearia.danzerra.barbeiro.service.BarbeiroService;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Periodo;

@RestController
@RequestMapping("/api")
public class BarbeiroController {

    private final BarbeiroService barbeiros;

    public BarbeiroController(BarbeiroService barbeiros) {
        this.barbeiros = barbeiros;
    }

    @GetMapping("/barbeiros")
    public List<BarbeiroResponse> listar(@RequestParam(defaultValue = "false") boolean incluirInativos) {
        return barbeiros.listar(incluirInativos);
    }

    @GetMapping("/barbeiros/desempenho")
    public BarbeiroDesempenhoResponse desempenho(@RequestParam LocalDate dia,
            @RequestParam(defaultValue = "MES") Periodo periodo) {
        return barbeiros.consultarDesempenho(dia, periodo);
    }

    @GetMapping("/barbeiros/{id}")
    public BarbeiroResponse consultar(@PathVariable Long id) {
        return barbeiros.consultar(id);
    }

    @PostMapping("/cadastrar_barbeiro")
    @ResponseStatus(HttpStatus.CREATED)
    public BarbeiroResponse cadastrar(@Valid @RequestBody BarbeiroRequest dados) {
        return barbeiros.cadastrar(dados);
    }

    @PutMapping("/atualizar_barbeiro/{id}")
    public BarbeiroResponse atualizar(@PathVariable Long id, @Valid @RequestBody BarbeiroRequest dados) {
        return barbeiros.atualizar(id, dados);
    }

    @PutMapping("/onoff_barbeiro/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alternarAtivo(@PathVariable Long id) {
        barbeiros.alternarAtivo(id);
    }

    @DeleteMapping("/apagar_barbeiro/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        barbeiros.excluir(id);
    }
}
