package projeto.barbearia.danzerra.administrador.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import projeto.barbearia.danzerra.administrador.entity.Administrador;
import projeto.barbearia.danzerra.administrador.repository.AdministradorRepository;
import projeto.barbearia.danzerra.administrador.exception.AdministradorDadosInvalidosException;

@Service
public class AdministradorService implements UserDetailsService {

    private final AdministradorRepository administradores;
    private final PasswordEncoder passwordEncoder;

    public AdministradorService(
            AdministradorRepository administradores,
            PasswordEncoder passwordEncoder) {
        this.administradores = administradores;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void cadastrar(String login, String senha) {
        String loginNormalizado = normalizarLogin(login);

        if (!loginNormalizado.matches("[a-z0-9._-]{3,50}")) {
            throw new AdministradorDadosInvalidosException(
                    "O login deve ter de 3 a 50 caracteres e deve usar letras sem acento, números, ponto, hífen ou sublinhado.");
        }

        if (senha == null || senha.isBlank()
                || senha.codePointCount(0, senha.length()) < 15
                || senha.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new AdministradorDadosInvalidosException(
                    "A senha deve ter pelo menos 15 caracteres e ocupar no máximo 72 bytes em UTF-8.");
        }

        String senhaHash = passwordEncoder.encode(senha);
        Administrador administrador = new Administrador(loginNormalizado, senhaHash);
        administradores.save(administrador);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String login) {
        String loginNormalizado = normalizarLogin(login);

        Administrador administrador = administradores.findByLogin(loginNormalizado)
                .orElseThrow(() -> new UsernameNotFoundException("Credenciais inválidas."));

        return User.withUsername(loginNormalizado)
                .password(administrador.getSenhaHash())
                .roles("ADMIN")
                .build();
    }

    private static String normalizarLogin(String login) {
        return login == null ? "" : login.strip().toLowerCase(Locale.ROOT);
    }
}