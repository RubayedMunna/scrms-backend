import sys
import csv
import json
import random
from deap import base, creator, tools, algorithms

# Constants
NUM_ROOMS = 3
NUM_COMP_LABS = 2
NUM_CIRC_LABS = 1
NUM_DAYS = 5
NUM_TIMESLOTS = 6

days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
times = ["Morning 1", "Morning 2", "Noon 1", "Noon 2", "Afternoon 1", "Afternoon 2"]
years = ["1st year", "2nd year", "3rd year", "4th year"]

# Get CSV file path from command line arguments
csv_file_path = sys.argv[1]

teachers = []
courses = []
preferences = []
classroom_types = []


with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        teachers.append(row['teacher_name'])
        preferred_days = row['preferred_days'].split(',') if row['preferred_days'] else []
        preferred_times = row['preferred_times'].split(',') if row['preferred_times'] else []
        preferences.append([preferred_days, preferred_times])
        course_list = row['courses'].split(',') if row['courses'] else []
        courses.extend([c.split('(')[0].strip() for c in course_list])
        for c in course_list:
            parts = c.split('(')
            if len(parts) > 1:
                class_type = parts[1].strip(')')
                classroom_types.append(class_type)
            else:
                classroom_types.append('Unknown')
                
def preference_to_indices(preferred_days, preferred_times):
    day_indices = [i for i, day in enumerate(days) if day in preferred_days]
    time_indices = [i for i, time in enumerate(times) if time in preferred_times]
    return day_indices, time_indices

def evaluate(individual):
    fitness = 0
    print("Evaluating individual:", individual)  # Debugging line
    for day in range(NUM_DAYS):
        for timeslot in range(NUM_TIMESLOTS):
            # Check if individual is as expected
            if not all(isinstance(ind, (list, tuple)) and len(ind) == 4 for ind in individual):
                print("Error in individual structure:", individual)
                return (float('inf'),)  # Return a high fitness value if structure is wrong

            rooms_used = [ind[2] for ind in individual if ind[0] == day and ind[1] == timeslot]
            if len(set(rooms_used)) != len(rooms_used):
                fitness -= 10

    for course in range(len(courses)):
        _, _, room, teacher = individual[course]
        class_type = classroom_types[course]
        if class_type == "theory" and room >= NUM_ROOMS:
            fitness -= 5
        elif class_type == "computer_lab" and (room < NUM_ROOMS or room >= NUM_ROOMS + NUM_COMP_LABS):
            fitness -= 10
        elif class_type == "circuit_lab" and room != NUM_ROOMS + NUM_COMP_LABS:
            fitness -= 15

    for course in range(len(courses)):
        day, timeslot, room, teacher = individual[course]
        preferred_days, preferred_times = preferences[teacher]
        preferred_day_indices, preferred_timeslot_indices = preference_to_indices(preferred_days, preferred_times)
        if day not in preferred_day_indices or timeslot not in preferred_timeslot_indices:
            fitness -= 5

    return (fitness,)

creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

toolbox = base.Toolbox()
toolbox.register("day", random.randint, 0, NUM_DAYS - 1)
toolbox.register("timeslot", random.randint, 0, NUM_TIMESLOTS - 1)
toolbox.register("room", random.randint, 0, NUM_ROOMS + NUM_COMP_LABS + NUM_CIRC_LABS - 1)
toolbox.register("teacher", random.randint, 0, len(teachers) - 1)
toolbox.register("course", lambda: [toolbox.day(), toolbox.timeslot(), toolbox.room(), toolbox.teacher()])
toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.course, n=len(courses))
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

toolbox.register("mate", tools.cxTwoPoint)
toolbox.register("mutate", tools.mutUniformInt, 
    low=[0] * len(courses) * 4, 
    up=[NUM_DAYS-1] * len(courses) + 
        [NUM_TIMESLOTS-1] * len(courses) + 
        [NUM_ROOMS + NUM_COMP_LABS + NUM_CIRC_LABS - 1] * len(courses) + 
        [len(teachers)-1] * len(courses), 
    indpb=0.1)
toolbox.register("select", tools.selTournament, tournsize=3)
toolbox.register("evaluate", evaluate)

def main():
    random.seed(42)
    pop = toolbox.population(n=300)
    hof = tools.HallOfFame(1)
    stats = tools.Statistics(lambda ind: ind.fitness.values[0])
    stats.register("avg", lambda values: sum(values) / len(values))
    stats.register("min", min)
    stats.register("max", max)
    algorithms.eaSimple(pop, toolbox, cxpb=0.5, mutpb=0.2, ngen=40, stats=stats, halloffame=hof, verbose=True)
    return pop, stats, hof

population, statistics, hall_of_fame = main()
best_schedule = hall_of_fame[0]

schedule = {day: {year: {timeslot: [] for timeslot in times} for year in years} for day in days}

for course in range(len(courses)):
    item = best_schedule[course]
    if isinstance(item, (list, tuple)) and len(item) == 4:
        day, timeslot, room, teacher = item
        room_type = "Classroom" if room < NUM_ROOMS else "Computer Lab" if room < NUM_ROOMS + NUM_COMP_LABS else "Circuit Lab"
        room_number = room + 1 if room < NUM_ROOMS else room - NUM_ROOMS + 1 if room < NUM_ROOMS + NUM_COMP_LABS else 1
        course_info = {
            "course": courses[course],
            "teacher": teachers[teacher],
            "room_type": room_type,
            "room_number": room_number
        }
        year = "1st year"  # This is a placeholder; adjust based on your scheduling logic
        schedule[days[day]][year][times[timeslot]].append(course_info)

print(json.dumps(schedule, indent=2))