package projeto.barbearia.danzerra.administrador.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import projeto.barbearia.danzerra.administrador.controller.AdministradorCadastroController;

@RestControllerAdvice(assignableTypes = AdministradorCadastroController.class)
public class AdministradorCadastroErros {

    @ExceptionHandler(AdministradorDadosInvalidosException.class)
    public ProblemDetail tratarDadosInvalidos(AdministradorDadosInvalidosException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, erro.getMessage());
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail tratarRestricao(ConstraintViolationException erro) {
        if (!"uq_administradores_login".equals(erro.getConstraintName())) {
            throw erro;
        }

        return ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT, "Esse login já está em uso.");
    }
}