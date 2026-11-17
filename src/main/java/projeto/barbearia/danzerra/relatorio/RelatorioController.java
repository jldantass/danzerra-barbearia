package projeto.barbearia.danzerra.relatorio;

import java.time.LocalDate;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import projeto.barbearia.danzerra.relatorio.RelatorioDados.Despesa;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Periodo;
import projeto.barbearia.danzerra.relatorio.RelatorioDados.Resumo;

@RestController
@RequestMapping("/api")
public class RelatorioController {

    private final RelatorioService relatorios;

    public RelatorioController(RelatorioService relatorios) {
        this.relatorios = relatorios;
    }

    @GetMapping("/relatorios")
    public Resumo relatorio(@RequestParam LocalDate dia, @RequestParam(defaultValue = "DIA") Periodo periodo) {
        return relatorios.consultar(dia, periodo);
    }

    @PostMapping("/cadastrar_despesa")
    @ResponseStatus(HttpStatus.CREATED)
    public void cadastrarDespesa(@Valid @RequestBody Despesa despesa) {
        relatorios.cadastrarDespesa(despesa);
    }
}
