import csv
import json
from collections import defaultdict

def get_available_rooms(course_type):
    rooms = {
        'Theory': ['Room 101', 'Room 102', 'Room 103'],
        'Lab': ['Lab 201', 'Lab 202', 'Lab 203']
    }
    return rooms.get(course_type, [])

def map_times(preferred_times):
    time_mapping = {
        'Morning': 'Morning 1',
        'Afternoon': 'Noon 1',
        'Noon': 'Noon 1'
    }
    return [time_mapping.get(time, time) for time in preferred_times.split(',')]

def parse_course(course):
    try:
        course_name, details = course.split('[')
        course_type = details.split(']')[0].strip()
        course_year = details.split(']')[1].strip() if ']' in details else 'All'
        return course_name.strip(), course_type, course_year
    except ValueError:
        return None, None, None

def allocate_courses(teachers, schedule):
    valid_days = set(schedule.keys())
    theory_count = defaultdict(int)
    room_occupancy = {day: {time: set() for time in schedule[day].keys()} for day in valid_days}

    for teacher in teachers:
        teacher_schedule = {day: {time: False for time in schedule[day].keys()} for day in valid_days}

        for course in teacher['courses']:
            course_name, course_type, course_year = parse_course(course)
            if not course_name:
                continue

            available_rooms = get_available_rooms(course_type)

            for day in teacher['preferred_days']:
                if day not in valid_days:
                    continue

                for time in map_times(teacher['preferred_times']):
                    if teacher_schedule[day][time]:
                        continue

                    rooms_in_use = room_occupancy[day][time]
                    available_for_this_time = [room for room in available_rooms if room not in rooms_in_use]

                    if not available_for_this_time:
                        continue

                    room = available_for_this_time[0]

                    if course_type in ['Computer Lab', 'Circuit Lab']:
                        next_time = {
                            'Morning 1': 'Morning 2',
                            'Morning 2': 'Noon 1',
                            'Noon 1': 'Noon 2',
                            'Noon 2': 'Afternoon 1',
                            'Afternoon 1': 'Afternoon 2'
                        }.get(time)

                        if next_time and len(schedule[day][next_time][course_year]) == 0:
                            if len(schedule[day][time][course_year]) == 0:
                                if len(schedule[day][next_time][course_year]) == 0:
                                    schedule[day][time][course_year].append({
                                        'teacher': teacher['name'],
                                        'course': course_name,
                                        'year': course_year,
                                        'room': room,
                                        'time': f"{time}+{next_time}"
                                    })
                                    schedule[day][next_time][course_year].append({
                                        'teacher': teacher['name'],
                                        'course': course_name,
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
                                        'course': course_name,
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

                next_time = {
                    'Morning 1': 'Morning 2',
                    'Morning 2': 'Noon 1',
                    'Noon 1': 'Noon 2',
                    'Noon 2': 'Afternoon 1',
                    'Afternoon 1': 'Afternoon 2'
                }.get(time)

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

    # Output the final schedule as JSON
    output = json.dumps(schedule)
    print(output)
