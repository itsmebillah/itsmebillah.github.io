## Hi there 👋, I’m Md. Masum Billah

I’m a **Data Analyst** passionate about transforming raw data into actionable insights.  
I enjoy working with **SQL**, **Python**, **Power BI**, and visualization tools to help businesses make data-driven decisions.

- 🔭 I’m currently working on improving my analytics and visualization skills  
- 🌱 I’m currently learning advanced DAX & Python for data analysis  
- 👯 I’m looking to collaborate on open-source data projects or dashboards  
- 💬 Ask me about SQL queries, Power BI, or building insightful dashboards  
- 📫 How to reach me: [itsmbillah@gmail.com] | [LinkedIn](https://www.linkedin.com/in/itsmebillah/)  
- ⚡ Fun fact: I love finding hidden patterns in messy datasets  

---

### 💻 Tech Stack

![SQL](https://img.shields.io/badge/SQL-EXPERT-2ea44f?style=for-the-badge&logo=mysql&logoColor=white)
![Power BI](https://img.shields.io/badge/Power_BI-EXPERT-F2C811?style=for-the-badge&logo=power-bi&logoColor=black)
![Python](https://img.shields.io/badge/Python-INTERMEDIATE-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Excel](https://img.shields.io/badge/Excel-ADVANCED-217346?style=for-the-badge&logo=microsoft-excel&logoColor=white)

---

### 🔍 Look me up!  

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white&logoWidth=40)](https://www.linkedin.com/in/itsmebillah/)  
[![Facebook](https://img.shields.io/badge/-Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white&logoWidth=40)](https://web.facebook.com/itsmebillah)



---

### 📊 GitHub Stats

![Md. Masum Billah's GitHub Stats](https://github-readme-stats.vercel.app/api?username=itsmebillah&show_icons=true&theme=radical)

---

### Automated blog publishing

The `Publish generated blog content` GitHub Actions workflow regenerates and commits the static blog artifacts. It runs through either:

- `workflow_dispatch` for a manual run from **Actions → Publish generated blog content → Run workflow**.
- `repository_dispatch` with the event type `publish-blogs` for external automation.

The workflow runs `node blog/generator/blog-page-generator.js`, validates the generator report, and commits only generated blog artifacts when they changed.

Apps Script will later trigger the same workflow by sending an authenticated GitHub `repository_dispatch` request with `event_type` set to `publish-blogs`. Apps Script integration is not implemented in this repository yet.
