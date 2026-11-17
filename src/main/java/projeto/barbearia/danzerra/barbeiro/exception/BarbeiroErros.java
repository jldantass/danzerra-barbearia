package projeto.barbearia.danzerra.barbeiro.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import projeto.barbearia.danzerra.agenda.controller.AgendaController;
import projeto.barbearia.danzerra.barbeiro.controller.BarbeiroController;

@RestControllerAdvice(assignableTypes = {BarbeiroController.class, AgendaController.class})
public class BarbeiroErros {

    @ExceptionHandler(BarbeiroException.class)
    public ProblemDetail tratarBarbeiro(BarbeiroException erro) {
        return ProblemDetail.forStatusAndDetail(erro.getStatusCode(), erro.getReason());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail tratarValidacao(MethodArgumentNotValidException erro) {
        Map<String, String> campos = new LinkedHashMap<>();
        erro.getBindingResult().getFieldErrors()
                .forEach(campo -> campos.putIfAbsent(campo.getField(), campo.getDefaultMessage()));
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Confira os campos informados.");
        problema.setProperty("erros", campos);
        return problema;
    }
}
