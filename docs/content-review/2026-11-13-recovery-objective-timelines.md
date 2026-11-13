# Recovery objective timeline review
Eight existing RTO/RPO lessons now distinguish resource restoration, process catch-up, data coverage, transfer completion, missed backups, logical corruption and validation endpoints. Only question/reasoning/lab fields changed.
Source inspected: NIST SP800-34r1 official PDF, Section3.2.1 definitions and relationship of MTD/RTO/RPO, and Section3.4.1 backup/recovery. Retrieved relevant verbatim source passages through PDF extraction after direct cloud download returned403. No claim of reading every page or of current compliance advice. DOI:https://doi.org/10.6028/NIST.SP.800-34r1
NIST explicitly distinguishes RPO from MTD and notes reprocessing can require RTO to be shorter than MTD. Synthetic timeline and queue models are original, not measurements.
The corruption exercise explicitly uses discovery-relative gaps rather than silently equating discovery with the corruption event; recovery point validity needs consistency evidence.
Validation pending. No runtime/UI/live changes; no merge/deploy.
