"""
Property-based tests para el simulador de nodos IoT de GreenNode.

Feature: mqtt-iot-integration, Property 4: Severidad por umbral
Validates: Requirements 6.2, 6.3

Usa Hypothesis para verificar la función pura `alert_severity` del simulador
(`simulation/iot_node_simulator.py`).
"""

import importlib.util
import os
import sys
import types

from hypothesis import given, settings
from hypothesis import strategies as st

# --- Import robusto de `alert_severity` ---------------------------------------
# El módulo del simulador tiene guiones bajos (es importable como módulo) pero
# hace `import paho.mqtt.client` al cargar y, si falta, llama a `exit(1)`. Para
# que este test no dependa de que paho esté instalado, inyectamos un stub mínimo
# de `paho.mqtt.client` en sys.modules ANTES de cargar el módulo, sólo si paho
# no está disponible. Así el import del simulador nunca aborta el proceso de
# test y podemos extraer la función pura `alert_severity`.
try:  # pragma: no cover - depende del entorno
    import paho.mqtt.client  # noqa: F401
except ImportError:  # pragma: no cover - fallback sin paho
    paho_pkg = types.ModuleType("paho")
    paho_mqtt_pkg = types.ModuleType("paho.mqtt")
    paho_mqtt_client = types.ModuleType("paho.mqtt.client")

    class _StubClient:  # comportamiento no usado por el test
        def __init__(self, *args, **kwargs):
            pass

    paho_mqtt_client.Client = _StubClient
    paho_pkg.mqtt = paho_mqtt_pkg
    paho_mqtt_pkg.client = paho_mqtt_client
    sys.modules.setdefault("paho", paho_pkg)
    sys.modules.setdefault("paho.mqtt", paho_mqtt_pkg)
    sys.modules.setdefault("paho.mqtt.client", paho_mqtt_client)

_MODULE_PATH = os.path.join(os.path.dirname(__file__), "iot_node_simulator.py")
_spec = importlib.util.spec_from_file_location("iot_node_simulator", _MODULE_PATH)
_sim = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sim)

alert_severity = _sim.alert_severity


# --- Property 4: Severidad por umbral -----------------------------------------
@settings(max_examples=200)
@given(fill_level=st.floats(min_value=0.0, max_value=100.0))
def test_property_alert_severity_por_umbral(fill_level):
    """Feature: mqtt-iot-integration, Property 4: Severidad por umbral.

    Validates: Requirements 6.2, 6.3

    `alert_severity` devuelve "medium" sii 90 <= fill <= 97 (equiv. fill < 98)
    y "high" sii fill >= 98. El resultado siempre es uno de esos dos valores.
    """
    result = alert_severity(fill_level)

    # El resultado SIEMPRE es "medium" o "high", nunca otra cosa.
    assert result in ("medium", "high")

    if fill_level >= 98:
        assert result == "high"
    else:
        # Rango de alerta [90, 98) => medium (y también < 90 => medium por diseño).
        assert result == "medium"


@settings(max_examples=100)
@given(fill_level=st.floats(min_value=90.0, max_value=97.9999))
def test_property_alert_severity_medium_en_rango_alerta(fill_level):
    """Feature: mqtt-iot-integration, Property 4: Severidad por umbral.

    Validates: Requirements 6.2, 6.3

    Para fill_level en [90, 98) el resultado es siempre "medium".
    """
    assert alert_severity(fill_level) == "medium"


@settings(max_examples=100)
@given(fill_level=st.floats(min_value=98.0, max_value=100.0))
def test_property_alert_severity_high_sobre_umbral(fill_level):
    """Feature: mqtt-iot-integration, Property 4: Severidad por umbral.

    Validates: Requirements 6.2, 6.3

    Para fill_level >= 98 el resultado es siempre "high".
    """
    assert alert_severity(fill_level) == "high"


# --- Ejemplos unitarios de frontera (complementan el property test) -----------
def test_boundary_98_es_high():
    """Validates: Requirements 6.3 — 98 exacto es el primer valor "high"."""
    assert alert_severity(98) == "high"


def test_boundary_97_es_medium():
    """Validates: Requirements 6.2 — 97 sigue siendo "medium"."""
    assert alert_severity(97) == "medium"


def test_boundary_90_es_medium():
    """Validates: Requirements 6.2 — 90 (umbral de alerta) es "medium"."""
    assert alert_severity(90) == "medium"
