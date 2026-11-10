# Rust Flow Telemetry Engine

A small, inspectable Rust CLI that aggregates synthetic flow records by source, destination and protocol.

## Run

```bash
cargo run -- sample_flows.csv
```

The current implementation intentionally uses only the Rust standard library and synthetic CSV fixtures. It does **not** capture packets, attach eBPF programs, inspect production traffic, or claim deployment in an employer environment.

## Roadmap

- Linux lab adapter for pcap/eBPF input
- Prometheus/OpenTelemetry export
- Benchmarks on larger synthetic traces
- Protocol and service enrichment
- Unit/property tests for malformed and adversarial input
