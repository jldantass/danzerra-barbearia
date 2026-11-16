package projeto.barbearia.danzerra.plano.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import projeto.barbearia.danzerra.plano.controller.PlanoController;

@RestControllerAdvice(assignableTypes = PlanoController.class)
public class PlanoErros {

    @ExceptionHandler(PlanoNaoEncontradoException.class)
    public ProblemDetail tratarNaoEncontrado(PlanoNaoEncontradoException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, erro.getMessage());
    }

    @ExceptionHandler(PlanoDadosInvalidosException.class)
    public ProblemDetail tratarDadosInvalidos(PlanoDadosInvalidosException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, erro.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail tratarValidacao(MethodArgumentNotValidException erro) {
        Map<String, String> campos = new LinkedHashMap<>();
        erro.getBindingResult().getFieldErrors()
                .forEach(campo -> campos.putIfAbsent(campo.getField(), campo.getDefaultMessage()));

        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Confira os campos do plano.");
        problema.setProperty("erros", campos);
        return problema;
    }
}
