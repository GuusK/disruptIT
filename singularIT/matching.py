import json
import random
from pprint import pprint
import pandas as pd

# set max imbalance for scheduling matches 
max_imbalance = 5

choices = {
    'Artificial Intelligence': ['Deloitte', 'ING'],
    'Strategic consultancy': ['Deloitte', 'Ortec'],
    'Business analytics': ['Achmea', 'Ortec'],
    'Technical consultancy': ['Topicus', 'Quintor', 'KPMG'],
    'DevOps': ['Quintor', 'DSW'],
    'Software development': ['Nedap', 'Quintor','Achmea', 'Rijksoverheid', 'Ortec'],
    'Data engineering': ['ING', 'Nedap', 'KPMG'],
    'Financial sector': ['Achmea', 'Topicus', 'ING'],
    'Healthcare sector': ['Nedap', 'Achmea', 'Topicus', 'DSW'],
    "I'm not sure": ['Procam'],
    'Information security': ['Deloitte', 'Rijksoverheid', 'KPMG'],
    'Traineeship': ['Procam', 'DSW', 'Rijksoverheid']
}

company_count_init = {
    'Nedap': 0,
    'Topicus': 0,
    'KPMG': 0,
    'Achmea': 0,
    'Procam': 0,
    'DSW': 0,
    'Rijksoverheid': 0,
    'Quintor': 0,
    'ING': 0,
    'Deloitte': 0,
    'Ortec': 0,
}

with open('users.json') as json_file:  
    users = json.load(json_file)

participants = {}
for user in users:
    participants[user['ticket'] ]= user['matchingterms']

# balance over the companies
end_balance = company_count_init.copy()

participants_count_results = {}
matching_counter = 0
# gather ranking counts for participants
for p, p_choices in participants.items():
    if p_choices:
        matching_counter += 1
        # get new dict for participant
        participant_count = company_count_init.copy()

        for choice in p_choices:
            for company in choices[choice]:
                participant_count[company] += 1
        
        # sort count dict
        company_list = list(participant_count.items())
        company_list.sort(key=lambda x: x[1], reverse=True)
        
        # merge equal results 
        company_list = pd.DataFrame(company_list, columns=['company', 'count'])
        company_list = company_list.groupby('count')['company'].apply(list)[::-1].tolist()

        result = []

        # fill with all number 1's
        if len(company_list[0]) < 4:
            result += company_list[0]
        else:
            r = random.sample(range(1, len(company_list[0])), 3)
            result += [company_list[0][r[0]], company_list[0][r[1]], company_list[0][r[2]]]

        # fill with number 2's (till a top 3)
        if len(result) < 3 and len(company_list) > 1:
            if len(company_list[1]) == 1:
                result += company_list[1]
            if len(company_list[1]) == 2 and len(result) == 1:
                result += company_list[1]
            if len(company_list[1]) > 2 and len(result) == 1:
                r = random.sample(range(1, len(company_list[1])), 2)
                result += [company_list[1][r[0]], company_list[1][r[1]]]
        
        # if there is not a top 3 yet, fill with a random nr 3
        if len(result) == 2 and len(company_list) > 2:
            if len(company_list[2]) == 1:
                result += company_list[2]
            else:
                r = random.sample(range(1, len(company_list[2])), 1)
                result += [company_list[2][r[0]]]

        # for end balance per company
        for r in result:
            end_balance[r] = end_balance[r] + 1

        participants_count_results[p] = result

# all participant with 2 items are expanded with the lowest matched company
for p, c in participants_count_results.items():
    if len(c) < 3:
        l = list(end_balance.items())
        l.sort(key=lambda x: x[1])
        min_company = l[0][0]
        c.append(min_company)
        participants_count_results[p] = c
        end_balance[min_company] = end_balance[min_company] + 1

imbalance = max_imbalance + 1
tries = 0
while imbalance > max_imbalance:

    for p, c in participants_count_results.items():
        random.shuffle(c)
        participants_count_results[p] = c

    r = []
    for column_nr in [0,1,2]:
        column = [row[column_nr] for row in participants_count_results.values()]
        counts = company_count_init.copy()
        for comp in column:
            counts[comp] += 1
        r.append(counts)
    end_counts = counts = company_count_init.copy()
    for p, c in end_counts.items():
        end_counts[p] = [r[0][p],r[1][p],r[2][p]]

    imbalance = max([max(i) - min(i) for p, i in end_counts.items()])

    tries += 1
    if not(tries % 1000):
        print(f"{tries} tries")

print("balance for matches over slots")
pprint(end_counts)

print("end count for matches")
pprint(end_balance)

for p, p_choices in participants.items():
    if not p_choices:
        l = list(end_balance.items())
        l.sort(key=lambda x: x[1])
        c = [comp[0] for comp in l[0:3]]
        participants_count_results[p] = c
        for min_company in c:
            end_balance[min_company] = end_balance[min_company] + 1

print("end count for total maching")
pprint(end_balance)

# do a check that no participant has double items
for cs in participants_count_results.values():
    if len(set(cs)) != 3: 
        raise ValueError('A participant got double items!')


print(f"{matching_counter} out of {len(users)} people filled in the questionnaire")

with open('matching.json', 'w') as outfile:  
    json.dump(participants_count_results, outfile)

print("matching output is written to matching.json")