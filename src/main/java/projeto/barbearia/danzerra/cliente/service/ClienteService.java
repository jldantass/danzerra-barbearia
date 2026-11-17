package projeto.barbearia.danzerra.cliente.service;

import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import projeto.barbearia.danzerra.cliente.dto.ClienteCadastroRequest;
import projeto.barbearia.danzerra.cliente.dto.ClienteResponse;
import projeto.barbearia.danzerra.cliente.entity.Cliente;
import projeto.barbearia.danzerra.cliente.exception.ClienteDadosInvalidosException;
import projeto.barbearia.danzerra.cliente.mapper.ClienteMapper;
import projeto.barbearia.danzerra.cliente.repository.ClienteRepository;
import projeto.barbearia.danzerra.cliente.exception.ClienteNaoEncontradoException;
import projeto.barbearia.danzerra.cliente.dto.ClienteAtualizacaoRequest;

@Service
public class ClienteService {

    private static final ZoneId FUSO_BARBEARIA = ZoneId.of("America/Fortaleza");

    private final ClienteRepository clientes;

    public ClienteService(ClienteRepository clientes) {
        this.clientes = clientes;
    }

    @Transactional
    public ClienteResponse cadastrar(ClienteCadastroRequest dados) {
        String nome = normalizarNome(dados.nome());
        String celular = normalizarCelular(dados.celular());

        Cliente cliente = new Cliente(nome, celular);
        Cliente salvo = clientes.save(cliente);

        return ClienteMapper.paraResponse(salvo);
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscarPorId(Long id) {
        Cliente cliente = clientes.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException(id));

        return ClienteMapper.paraResponse(cliente);
    }

    @Transactional(readOnly = true)
    public Page<ClienteResponse> buscar(String nome, String celular, boolean planoAtivo, Pageable pagina) {
        String nomeFiltro = nome == null || nome.isBlank() ? "" : normalizarNome(nome);
        String celularFiltro = celular == null || celular.isBlank() ? "" : normalizarCelular(celular);

        Page<Cliente> resultado = clientes.buscar(nomeFiltro, celularFiltro, planoAtivo,
                LocalDate.now(FUSO_BARBEARIA), pagina);

        return resultado.map(ClienteMapper::paraResponse);
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteAtualizacaoRequest dados) {
        Cliente cliente = clientes.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException(id));

        String nome = normalizarNome(dados.nome());
        String celular = normalizarCelular(dados.celular());
        cliente.atualizarDados(nome, celular);

        Cliente atualizado = clientes.save(cliente);
        return ClienteMapper.paraResponse(atualizado);
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = clientes.findById(id)
                .orElseThrow(() -> new ClienteNaoEncontradoException(id));

        clientes.delete(cliente);
    }

    private static String normalizarNome(String nome) {
        if (nome == null || nome.isBlank() || nome.length() > 120) {
            throw new ClienteDadosInvalidosException(
                    "Informe um nome preenchido com até 120 caracteres.");
        }

        return nome.strip();
    }

    private static String normalizarCelular(String celular) {
        if (celular == null || celular.isBlank()) {
            throw new ClienteDadosInvalidosException("Informe o celular do cliente.");
        }

        String texto = celular.strip();
        if (!texto.matches("\\+?[0-9() .-]+")) {
            throw new ClienteDadosInvalidosException(
                    "O celular deve conter números e pode usar espaços, parênteses, ponto, hífen e + no início.");
        }

        String numero = texto.replaceAll("[^0-9]", "");
        if (numero.isEmpty() || numero.length() > 15) {
            throw new ClienteDadosInvalidosException(
                    "O celular deve conter de 1 a 15 dígitos.");
        }

        return numero;
    }
}
