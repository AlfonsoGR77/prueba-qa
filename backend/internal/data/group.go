package data

import "slices"

// GroupByMeter separa las lecturas por medidor y las ordena por fecha.
func GroupByMeter(readings []Reading) map[string][]Reading {
	groups := map[string][]Reading{}
	for _, r := range readings {
		groups[r.MeterID] = append(groups[r.MeterID], r)
	}
	for _, rs := range groups {
		slices.SortFunc(rs, func(a, b Reading) int {
			return a.Timestamp.Compare(b.Timestamp)
		})
	}
	return groups
}

// GroupEventsByMeter separa los eventos por medidor.
func GroupEventsByMeter(events []Event) map[string][]Event {
	groups := map[string][]Event{}
	for _, e := range events {
		groups[e.MeterID] = append(groups[e.MeterID], e)
	}
	return groups
}
