FROM eclipse-mosquitto:2 AS base

FROM eclipse-mosquitto:2
COPY --from=base /usr/sbin/mosquitto /usr/sbin/mosquitto-bin
COPY --chown=mosquitto:mosquitto mosquitto.conf /mosquitto/config/mosquitto.conf
CMD ["/usr/sbin/mosquitto-bin", "-c", "/mosquitto/config/mosquitto.conf"]



