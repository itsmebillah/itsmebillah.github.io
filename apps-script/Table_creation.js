function importCSVData() {
  const ss = SpreadsheetApp.openById("1ZnoWdyyqzutrIs6SBnYfwN3a9aVsPNPJjzw9lWu76iE");
  
  // Clear existing sheets
  const existingSheets = ss.getSheets();
  existingSheets.forEach((sheet, index) => {
    if (index > 0) {
      ss.deleteSheet(sheet);
    }
  });
  
  // CSV data with proper parsing
  const sheetsData = [
    {
      name: "Profile",
      headers: ["Name", "Title", "Email", "Phone", "Location", "Bio", "Facebook", "LinkedIn", "WhatsApp", "GitHub", "ProfilePic", "HeroBG"],
      rows: [
        ["Md. Masum Billah", "Data Analyst | Automation Developer | Business Intelligence Specialist", "itsmbillah@gmail.com", "+880 1915-966721", "Dhaka, Bangladesh", "Data Analyst at Data Solution 360 with expertise in data analysis, automation, and business intelligence. Passionate about transforming raw data into actionable insights using modern analytical tools.", "https://www.facebook.com/itsmebillah", "https://linkedin.com/in/itsmebillah", "https://wa.me/8801915966721", "https://github.com/itsmbillah", "https://i.postimg.cc/SRhCysjL/Whats-App-Image-2025-10.jpg", "https://i.ibb.co.com/Zzcqwr47/20250812-151112.jpg"]
      ]
    },
    {
      name: "Projects",
      headers: ["Name", "Description", "Image", "Tags", "LiveURL", "GitHubURL", "Featured", "DemoEmail", "DemoPassword", "Published"],
      rows: [
        ["Autopilot Business System", "Fully automated Point of Sale & Business Management System built using Google Sheets and Apps Script", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&w=400", "Google Apps Script,Automation,Google Sheets API", "https://script.google.com/macros/s/AKfycbzJwA27QizVfbsVt3uJl1_mdJxAaU5dU0qFvUvESSNS1Fv277UCerV5-1qiP9dU0aY5/exec", "#", "TRUE", "itsmbillah@gmail.com", "123456", "TRUE"],
        ["Car Sales Analysis", "Vehicle sales trends and profitability analysis with Power BI dashboard", "https://i.postimg.cc/Hnp5vTtn/Screenshot-2025-07-28-110516.png", "Power BI,SQL,Data Analysis,Dashboard", "https://app.powerbi.com/view?r=eyJrIjoiNzVlYzIyNzEtYjc2Ni00MjY4LWJlYTAtOWUzYTBlZTdhMjVkIiwidCI6IjliOTk0Yjg2LWZmNjctNGEyNC05YTBjLTFkYzgzNWVjOTJjNSIsImMiOjEwfQ%3D%3D", "#", "TRUE", "", "", "TRUE"],
        ["HR Analytics Dashboard", "Employee performance and retention analysis with advanced SQL queries", "https://i.postimg.cc/bNZdyGd8/Screenshot-2025-07-28-110453.png", "Power BI,SQL,HR Analytics,Dashboard", "https://app.powerbi.com/view?r=eyJrIjoiMjBhNzM1MDEtNTZiYy00MGM1LWJhM2MtY2NlZmYyZTA0ZjQ4IiwidCI6IjliOTk0Yjg2LWZmNjctNGEyNC05YTBjLTFkYzgzNWVjOTJjNSIsImMiOjEwfQ%3D%3D", "#", "TRUE", "", "", "TRUE"]
      ]
    },
    {
      name: "Skills",
      headers: ["Name", "Level", "Category"],
      rows: [
        ["Google Apps Script", "90", "Automation"],
        ["SQL", "85", "Data Analysis"],
        ["Python", "80", "Programming"],
        ["Excel", "95", "Data Analysis"],
        ["Power BI", "85", "Data Visualization"],
        ["Data Analysis", "88", "Analytics"],
        ["Automation", "92", "Technical"],
        ["Marketing Analytics", "75", "Business"]
      ]
    },
    {
      name: "Experience",
      headers: ["Title", "Company", "Period", "Description", "Icon"],
      rows: [
        ["Data Analyst", "Data Solution 360", "June 2025 – Present", "Developed automated data pipelines reducing manual reporting time by 70%. Designed Google Apps Script automations for seamless business workflows. Built custom automation for certificate generation and CRM email triggers.", "fa-briefcase"],
        ["Accounts Executive", "Orient Button Ltd.", "2023 – 2025", "Created advanced Excel dashboards for financial KPIs and variance trends. Automated recurring monthly reporting using VBA and Google Sheets. Managed and analyzed sales and expense data across departments.", "fa-chart-line"]
      ]
    },
    {
      name: "Education",
      headers: ["Degree", "Institution", "Period", "Description", "Icon"],
      rows: [
        ["Bachelor of Business Administration (BBA)", "Mohammadpur Kendriya College", "2018 – 2022", "Specialized in Marketing with coursework in business analytics, statistics, and strategic management. Graduated with honors and completed a thesis on data-driven marketing strategies.", "fa-graduation-cap"],
        ["Data Analytics Certification", "Google Data Analytics Professional Certificate", "2023 – 2024", "Completed comprehensive training in data analysis, visualization, and interpretation using industry-standard tools including SQL, R, Tableau, and advanced Excel functions.", "fa-certificate"]
      ]
    },
    {
      name: "Certificates",
      headers: ["Name", "Organization", "Date", "ImageURL", "VerifyURL", "Skills", "Published"],
      rows: [
        ["Google Data Analytics Professional Certificate", "Google", "2024", "https://images.unsplash.com/photo-1551288049-bebda4e38f71", "https://coursera.org/verify/XXXX", "Data Analysis,SQL,R,Tableau", "TRUE"],
        ["Microsoft Excel Expert", "Microsoft", "2023", "https://images.unsplash.com/photo-1551288049-bebda4e38f71", "https://learn.microsoft.com/en-us/credentials/certifications/exams/", "Excel,Data Analysis,Formulas", "TRUE"]
      ]
    },
    {
      name: "Blogs",
      headers: ["Title", "Description", "Content", "Thumbnail", "Category", "DocID", "Date", "Published"],
      rows: [
        ["How I Automated Business Reporting", "Learn how automation can save 80% of your reporting time", "This is the full content of the blog post about automation and how it can transform your business processes.", "https://images.unsplash.com/photo-1551288049-bebda4e38f71", "Case Study", "", "2025-01-15", "TRUE"],
        ["Data Visualization Best Practices", "Creating effective dashboards that drive decisions", "Best practices for data visualization and dashboard design that help in making informed business decisions.", "https://images.unsplash.com/photo-1551288049-bebda4e38f71", "Tutorial", "", "2025-01-10", "TRUE"]
      ]
    },
    {
      name: "Submissions",
      headers: ["Timestamp", "Name", "Email", "Subject", "Message", "Status", "SubmissionID"],
      rows: []
    },
    {
      name: "VisitorLog",
      headers: ["Timestamp", "VisitorID", "Page", "Referrer", "ScreenSize", "UserAgent", "TimeSpent"],
      rows: []
    }
  ];
  
  // Create sheets and add data
  sheetsData.forEach(sheetConfig => {
    const sheet = ss.insertSheet(sheetConfig.name);
    
    // Add headers
    sheet.getRange(1, 1, 1, sheetConfig.headers.length).setValues([sheetConfig.headers]);
    
    // Add data rows if any
    if (sheetConfig.rows.length > 0) {
      sheet.getRange(2, 1, sheetConfig.rows.length, sheetConfig.headers.length).setValues(sheetConfig.rows);
    }
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, sheetConfig.headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#FF6B35');
    headerRange.setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, sheetConfig.headers.length);
    
    // Add borders to data
    if (sheetConfig.rows.length > 0) {
      const dataRange = sheet.getRange(1, 1, sheetConfig.rows.length + 1, sheetConfig.headers.length);
      dataRange.setBorder(true, true, true, true, true, true);
    }
    
    console.log(`✅ ${sheetConfig.name} sheet created with ${sheetConfig.rows.length} rows`);
  });
  
  // Delete default sheet (Sheet1)
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }
  
  return "🎉 All sheets created successfully! Your portfolio is ready!";
}