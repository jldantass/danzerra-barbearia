package projeto.barbearia.danzerra.agenda.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

final class HorarioBarbearia {

    private static final ZoneId FUSO = ZoneId.of("America/Fortaleza");

    private HorarioBarbearia() {
    }

    static LocalDateTime agora() {
        return LocalDateTime.now(FUSO);
    }

    static List<Faixa> expediente(LocalDate dia) {
        return switch (dia.getDayOfWeek()) {
            case SUNDAY -> List.of();
            case SATURDAY -> List.of(new Faixa(LocalTime.of(9, 0), LocalTime.of(13, 0)));
            default -> List.of(new Faixa(LocalTime.of(9, 0), LocalTime.of(13, 0)),
                    new Faixa(LocalTime.of(14, 0), LocalTime.of(18, 0)));
        };
    }

    record Faixa(LocalTime inicio, LocalTime fim) {
    }
}
