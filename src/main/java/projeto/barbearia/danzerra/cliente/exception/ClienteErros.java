package projeto.barbearia.danzerra.cliente.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import projeto.barbearia.danzerra.cliente.controller.ClienteCadastroController;

@RestControllerAdvice(basePackageClasses = ClienteCadastroController.class)
public class ClienteErros {

    @ExceptionHandler(ClienteDadosInvalidosException.class)
    public ProblemDetail tratarDadosInvalidos(ClienteDadosInvalidosException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, erro.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail tratarValidacao(MethodArgumentNotValidException erro) {
        Map<String, String> campos = new LinkedHashMap<>();
        erro.getBindingResult().getFieldErrors()
                .forEach(campo -> campos.putIfAbsent(campo.getField(), campo.getDefaultMessage()));

        ProblemDetail problema = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Confira os campos do cliente.");
        problema.setProperty("erros", campos);
        return problema;
    }

    @ExceptionHandler(ClienteNaoEncontradoException.class)
    public ProblemDetail tratarNaoEncontrado(ClienteNaoEncontradoException erro) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, erro.getMessage());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ProblemDetail tratarParametrosInvalidos(HandlerMethodValidationException erro) {
        return ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Use pagina entre 0 e 1000000 e tamanho entre 1 e 100.");
    }
}