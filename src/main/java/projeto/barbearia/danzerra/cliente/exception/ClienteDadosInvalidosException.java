package projeto.barbearia.danzerra.cliente.exception;

public class ClienteDadosInvalidosException extends RuntimeException {

    public ClienteDadosInvalidosException(String mensagem) {
        super(mensagem);
    }
}