use std::collections::HashMap;
use std::env;
use std::fs;

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
struct FlowKey {
    src: String,
    dst: String,
    proto: String,
}

#[derive(Debug, Default, Clone)]
struct Aggregate {
    bytes: u64,
    packets: u64,
    max_latency_ms: u64,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = env::args().nth(1).unwrap_or_else(|| "sample_flows.csv".into());
    let input = fs::read_to_string(&path)?;
    let mut flows: HashMap<FlowKey, Aggregate> = HashMap::new();

    for (line_no, line) in input.lines().enumerate() {
        if line_no == 0 || line.trim().is_empty() {
            continue;
        }
        let fields: Vec<&str> = line.split(',').map(str::trim).collect();
        if fields.len() != 6 {
            eprintln!("skipping malformed line {}: {}", line_no + 1, line);
            continue;
        }

        let key = FlowKey {
            src: fields[0].to_string(),
            dst: fields[1].to_string(),
            proto: fields[2].to_uppercase(),
        };
        let bytes: u64 = fields[3].parse()?;
        let packets: u64 = fields[4].parse()?;
        let latency_ms: u64 = fields[5].parse()?;

        let entry = flows.entry(key).or_default();
        entry.bytes += bytes;
        entry.packets += packets;
        entry.max_latency_ms = entry.max_latency_ms.max(latency_ms);
    }

    let mut ranked: Vec<_> = flows.into_iter().collect();
    ranked.sort_by(|a, b| b.1.bytes.cmp(&a.1.bytes));

    println!("SRC,DST,PROTO,BYTES,PACKETS,MAX_LATENCY_MS");
    for (key, agg) in ranked {
        println!(
            "{},{},{},{},{},{}",
            key.src, key.dst, key.proto, agg.bytes, agg.packets, agg.max_latency_ms
        );
    }
    Ok(())
}
