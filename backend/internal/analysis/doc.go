// Package analysis es el motor de detección de anomalías.
//
// Este paquete solo orquesta (analyze.go). Cada paso vive en su propia carpeta:
//
//	stats/      mediana, MAD y z robusto.
//	baseline/   cómo se comporta normalmente cada medidor (primeros 7 días).
//	quality/    si las variables eléctricas son coherentes.
//	changes/    cambios sostenidos del consumo.
//	variables/  cómo se movió cada variable durante el problema.
//	classify/   tipo de anomalía, severidad, confianza, explicación y acción.
//	model/      los tipos del resultado (Anomaly, Evidence, Check...).
package analysis
