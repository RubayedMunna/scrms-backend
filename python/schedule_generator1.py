import csv
import json
import sys
import os
from collections import defaultdict

def parse_csv(file_path):
    teachers = []
    with open(file_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            teacher = {
                'name': row['teacher_name'],
                'preferred_days': row['preferred_days'].split(','),
                'preferred_times': row['preferred_times'].split(','),
                'courses': row['courses'].split(',')
            }
            teachers.append(teacher)
    return teachers

def initialize_schedule():
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    times = ['Morning 1', 'Morning 2', 'Noon 1', 'Noon 2', 'Afternoon 1', 'Afternoon 2']
    schedule = {day: {time: defaultdict(list) for time in times} for day in days}
    return schedule

def get_available_rooms(course_type):
    room_types = {
        'Theory': ['Theory Room 101', 'Theory Room 102', 'Theory Room 103'],
        'Computer Lab': ['Computer Lab 202', 'Computer Lab 203', 'Computer Lab 302'],
        'Circuit Lab': ['Circuit Lab 157']
    }
    return room_types.get(course_type, [])

def allocate_courses(teachers, schedule):
    valid_days = set(schedule.keys())
    theory_count = defaultdict(int)
    room_occupancy = {day: {time: set() for time in schedule[day].keys()} for day in valid_days}

    for teacher in teachers:
        teacher_schedule = {day: {time: False for time in schedule[day].keys()} for day in valid_days}

        for course in teacher['courses']:
            course_name, course_details = course.split('[')
            course_type, course_year = course_name.split('(')[1].strip(')'), course_details.strip(']')
            available_rooms = get_available_rooms(course_type)

            for day in teacher['preferred_days']:
                if day not in valid_days:
                    continue

                for time in teacher['preferred_times']:
                    if teacher_schedule[day][time]:
                        continue

                    rooms_in_use = room_occupancy[day][time]
                    available_for_this_time = [room for room in available_rooms if room not in rooms_in_use]

                    if not available_for_this_time:
                        continue

                    room = available_for_this_time[0]

                    if course_type in ['Computer Lab', 'Circuit Lab']:
                       
                        next_time = None
                        if time == 'Morning 1':
                            next_time = 'Morning 2'
                        elif time == 'Morning 2':
                            next_time = 'Noon 1'
                        elif time == 'Noon 1':
                            next_time = 'Noon 2'
                        elif time == 'Noon 2':
                            next_time = 'Afternoon 1'
                        elif time == 'Afternoon 1':
                            next_time = 'Afternoon 2'

                        if next_time and len(schedule[day][next_time][course_year]) == 0:
                            if len(schedule[day][time][course_year]) == 0:
                                schedule[day][time][course_year].append({
                                    'teacher': teacher['name'],
                                    'course': course_name.strip(),
                                    'year': course_year,
                                    'room': room,
                                    'time': f"{time}+{next_time}"
                                })
                                schedule[day][next_time][course_year].append({
                                    'teacher': teacher['name'],
                                    'course': course_name.strip(),
                                    'year': course_year,
                                    'room': room
                                })
                                room_occupancy[day][time].add(room)
                                room_occupancy[day][next_time].add(room)
                                teacher_schedule[day][time] = True
                                teacher_schedule[day][next_time] = True
                                break
                    else:
                        if len(schedule[day][time][course_year]) == 0:
                            if course_type == 'Theory':
                                if all(course['room'] != room for course in schedule[day][time][course_year]):
                                    schedule[day][time][course_year].append({
                                        'teacher': teacher['name'],
                                        'course': course_name.strip(),
                                        'year': course_year,
                                        'room': room
                                    })
                                    theory_count[day] += 1
                                    room_occupancy[day][time].add(room)
                                    teacher_schedule[day][time] = True
                                    break

    for day in valid_days:
        if theory_count[day] < 2:
            needed_classes = 2 - theory_count[day]
            for _ in range(needed_classes):
                for teacher in teachers:
                    if any(course.split('[')[0].split('(')[0].strip() == 'Theory' for course in teacher['courses']):
                        for time in schedule[day].keys():
                            if len(schedule[day][time]['All']) == 0:
                                available_rooms = get_available_rooms('Theory')
                                for room in available_rooms:
                                    if room not in room_occupancy[day][time]:
                                        schedule[day][time]['All'].append({
                                            'teacher': teacher['name'],
                                            'course': 'Additional Theory Course',
                                            'year': 'All',
                                            'room': room
                                        })
                                        theory_count[day] += 1
                                        room_occupancy[day][time].add(room)
                                        break
                            if theory_count[day] >= 2:
                                break

    lab_rooms = ['Computer Lab 203', 'Computer Lab 302', 'Circuit Lab 157']
    scheduled_lab_rooms = {room: False for room in lab_rooms}

    for day in valid_days:
        for time in schedule[day].keys():
            for room in lab_rooms:
                if scheduled_lab_rooms[room]:
                    continue

                next_time = None
                if time == 'Morning 1':
                    next_time = 'Morning 2'
                if time == 'Morning 2':
                    next_time = 'Noon 1'
                elif time == 'Noon 1':
                    next_time = 'Noon 2'
                elif time == 'Noon 2':
                    next_time = 'Afternoon 1'
                elif time == 'Afternoon 1':
                    next_time = 'Afternoon 2'

                if next_time and len(schedule[day][next_time]['All']) == 0:
                    schedule[day][time]['All'].append({
                        'teacher': 'Lab Instructor',
                        'course': f'Lab in {room}',
                        'year': 'All',
                        'room': room,
                        'time': f"{time}+{next_time}"
                    })
                    schedule[day][next_time]['All'].append({
                        'teacher': 'Lab Instructor',
                        'course': f'Lab in {room}',
                        'year': 'All',
                        'room': room
                    })
                    room_occupancy[day][time].add(room)
                    room_occupancy[day][next_time].add(room)
                    scheduled_lab_rooms[room] = True

def main(file_path):
    teachers = parse_csv(file_path)
    schedule = initialize_schedule()
    allocate_courses(teachers, schedule)

    print(json.dumps(schedule, indent=4))

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python schedule_generator.py uploads_routine_csvfiles\1722514506892.csv")
        sys.exit(1)    
 

    csv_file_path = sys.argv[1]
    schedule = main(csv_file_path)
