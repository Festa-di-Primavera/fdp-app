import type { Ticket } from '../../models/ticket';

export interface ChartData {
	labels: string[];
	datasets: number[];
}

export enum SalesTimeSlot {
	TWELVE_HOURS = 1000*60*60*12,
	DAY = 1000*60*60*24,
	TWO_DAYS = 1000*60*60*24*2,
	WEEK = 1000*60*60*24*7,
	TWO_WEEKS = 1000*60*60*24*14,
}

export enum CheckInTimeSlot {
	FIFTEEN_MINUTES = 1000*60*15,
	HALF_HOUR = 1000*60*30,
	HOUR = 1000*60*60,
	TWO_HOURS = 1000*60*60*2,
}

export function computeSellersStats(tickets: Ticket[]): ChartData {
	const sellersStats: Map<string, number> = new Map();

	for (const ticket of tickets) {
		if (ticket.seller !== null) {
			sellersStats.set(ticket.seller, (sellersStats.get(ticket.seller) || 0) + 1);
		}
	}
	
	const labels: string[] = [];
	const datasets: number[] = [];

	for (const [seller, sales] of sellersStats) {
		labels.push(seller);
		datasets.push(sales);
	}

	return { labels, datasets };
}

export function computeSalesPerHour(tickets: Ticket[]): ChartData {
	const sellHoursStats: Map<number, number> = new Map();

	for (const ticket of tickets) {
		if (ticket.soldAt !== null) {
			sellHoursStats.set((new Date(ticket.soldAt)).getHours(), (sellHoursStats.get((new Date(ticket.soldAt)).getHours()) || 0) + 1);
		}
	}

	const labels: string[] = [];
	const datasets: number[] = [];

	// iterate over hours
	for (let hour = 0; hour < 24; hour++) {
		const label = hour < 10 ? `0${hour}:00` : `${hour}:00`;
		labels.push(label);
		datasets.push(sellHoursStats.get(hour) || 0);
	}

	return { labels, datasets };
}

export function computeSalesPerTime(tickets: Ticket[], timeSlot: SalesTimeSlot = SalesTimeSlot.DAY): ChartData {
	// map associa una label univoca ad un id numerico sortabile e un numero di vendite
	const timeSlotsMap: Map<number, number> = new Map();

	for (const ticket of tickets) {
		if (ticket.soldAt !== null) {
			const dateTime = new Date(ticket.soldAt);

			const slotIndex = Math.floor((dateTime.getTime()+1000*60*60) / timeSlot);

			const periodStart = slotIndex * timeSlot;
			// incremento il numero di vendite per il timeslot
			timeSlotsMap.set(periodStart, (timeSlotsMap.get(periodStart) || 0) + 1);
		}
	}

	// ordino i timeslot in ordine crescente
	const sortedTimeSlots = Array.from(timeSlotsMap.entries()).sort((a, b) => a[0] - b[0]);

	// creo un array di label e un array di vendite
	const labels: string[] = [];
	const datasets: number[] = [];

	if (sortedTimeSlots.length === 0) {
		return { labels, datasets };
	}

	// per ogni timeslot
	for (let indTimeSlot = sortedTimeSlots[0][0]; indTimeSlot <= sortedTimeSlots[sortedTimeSlots.length - 1][0]; indTimeSlot += timeSlot) {
		const date = new Date(indTimeSlot);

		const day = date.getDate();
		const month = date.toLocaleString('default', { month: 'short' });
		const hour = date.getHours();

		let label: string;

		switch (timeSlot) {
			case SalesTimeSlot.TWELVE_HOURS:
				label = `${day < 10 ? '0'+day : day} ${month} (${hour < 12 ? "AM" : "PM"})`;
				break;
			case SalesTimeSlot.DAY:
				label = `${day < 10 ? '0'+day : day} ${month}`;
				break;
			case SalesTimeSlot.TWO_DAYS:
			case SalesTimeSlot.WEEK:
			case SalesTimeSlot.TWO_WEEKS: {
				let nextDate = new Date(indTimeSlot + timeSlot);
				const offset = nextDate.getTimezoneOffset() * 60 * 1000; // millisecondi
				nextDate = new Date(nextDate.getTime() + offset - 1);

				const nextDay = nextDate.getDate();
				const nextMonth = nextDate.toLocaleString('default', { month: 'short' });
				label = `${day < 10 ? '0'+day : day} ${month} - ${nextDay < 10 ? '0'+nextDay : nextDay} ${nextMonth}`;
				break;
			}
			default:
				throw new Error("Invalid timeSlot");
		}

		labels.push(label);

		// se il timeslot è presente nell'array ordinato
		if (timeSlotsMap.has(indTimeSlot)) {
			// aggiungo il numero di vendite al dataset
			datasets.push(timeSlotsMap.get(indTimeSlot) as number);
		} else {
			// altrimenti aggiungo 0
			datasets.push(0);
		}
	}

	return { labels, datasets };

}

export function computeCheckInPerTime(tickets: Ticket[], timeSlot: CheckInTimeSlot = CheckInTimeSlot.HOUR){
	const checkInsMap: Map<number, number> = new Map();

	for (const ticket of tickets) {
		if (ticket.checkIn !== null) {
			const dateTime = new Date(ticket.checkIn);

			const slotIndex = Math.floor((dateTime.getTime()) / timeSlot);
			const periodStart = slotIndex * timeSlot;

			checkInsMap.set(periodStart, (checkInsMap.get(periodStart) || 0) + 1);
		}
	}

	const sortedCheckIns = Array.from(checkInsMap.entries()).sort((a, b) => a[0] - b[0]);

	const labels: string[] = [];
	const datasets: number[] = [];

	if (sortedCheckIns.length === 0) {
		return { labels, datasets };
	}

	for (let indTimeSlot = sortedCheckIns[0][0]; indTimeSlot <= sortedCheckIns[sortedCheckIns.length - 1][0]; indTimeSlot += timeSlot) {
		const date = new Date(indTimeSlot);

		const day = date.getDate();
		const month = date.toLocaleString('default', { month: 'short' });
		const hour = date.getHours();
		const minutes = date.getMinutes();

		let label: string;

		switch (timeSlot) {
			case CheckInTimeSlot.FIFTEEN_MINUTES:
				label = `${day < 10 ? '0'+day : day} ${month},${hour}:${minutes < 10 ? '0'+minutes : minutes}`;
				break;
			case CheckInTimeSlot.HALF_HOUR:
				/* label = `${day < 10 ? '0'+day : day} ${month},${hour}:${minutes < 30 ? '00' : '30'}-${(hour+1)%24}:${minutes < 30 ? '30' : '00'}`; */
				label = `${day < 10 ? '0'+day : day} ${month}, ${hour}:${minutes < 30 ? '00' : '30'}`
				break;
			case CheckInTimeSlot.HOUR:
				label = `${day < 10 ? '0'+day : day} ${month}, ${hour}:00-${(hour+1)%24}:00`;
				break;
			case CheckInTimeSlot.TWO_HOURS:
				// label 'gg mmm hh:00-hh+1:00'
				label = `${day < 10 ? '0'+day : day} ${month},${hour}:00-${(hour+2)%24}:00`;
				break;
			default:
				throw new Error("Invalid timeSlot");
		}

		labels.push(label);

		if (checkInsMap.has(indTimeSlot)) {
			datasets.push(checkInsMap.get(indTimeSlot) as number);
		} else {
			datasets.push(0);
		}
	}

	return { labels, datasets };
}