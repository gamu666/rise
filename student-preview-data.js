// PREVIEW DATA for the student page — replace with real records once teachers/managers enter them.
// Used only for the parts that have no real data yet (student.js checks real data first, per section).
// Every value is a placeholder: no real exam result, payment or attendance record.
// Course shape follows common Mongolian heavy-machinery operator courses: 21 days, about 14 days of
// theory incl. safety, then supervised practice on a real machine, a safety test (pass >= 70%) and a final
// theory + practical exam; certificate + operator ID when the course is finished and tuition is fully paid.
((root)=>{
 const add=(day,n)=>{const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 const weekday=day=>new Date(day+'T00:00:00Z').getUTCDay();
 function build(today,profile){
  const course=profile.courses[0],c=course.id,start=add(today,-9),days=21,end=add(start,days-1);
  const lesson=(n,section,title,type,minutes,description)=>({id:'preview-'+c+'-'+n,courseId:c,status:'ready',section,title,type,minutes,description,url:'',preview:true});
  const lessons=[
   lesson(1,'1. Машины бүтэц','Экскаваторын ерөнхий бүтэц','video',18,'Их бие, сум, шанага, гинжит явах эд анги — үндсэн хэсгүүдийн нэр, үүрэг.'),
   lesson(2,'1. Машины бүтэц','Гидравлик систем хэрхэн ажилладаг вэ','video',22,'Насос, цилиндр, хавхлага. Даралт алдагдах үеийн шинж тэмдэг.'),
   lesson(3,'1. Машины бүтэц','Кабин ба удирдлагын хөшүүрэг','file',10,'Хөшүүргийн байрлал, удирдлагын хоёр стандарт загвар.'),
   lesson(4,'2. Аюулгүй ажиллагаа','Ажлын талбайн аюулгүй байдал','video',20,'Аюултай бүс, дохио, газар доорх шугам, хамгаалах хувцас хэрэглэл.'),
   lesson(5,'2. Аюулгүй ажиллагаа','Ажил эхлэхийн өмнөх үзлэг','file',12,'Өдөр бүрийн үзлэгийн хуудас: тос, гоожилт, гинж, гэрэл, дохио.'),
   lesson(6,'2. Аюулгүй ажиллагаа','Онцгой нөхцөл ба осол','video',16,'Налуу дээр хөмрөх эрсдэл, цахилгааны шугамтай ойртох үеийн дүрэм.'),
   lesson(7,'3. Ажлын техник','Ухалт ба ачилт','video',24,'Шанаганы өнцөг, ачааны машинд ачих дараалал.'),
   lesson(8,'3. Ажлын техник','Траншей ба налуу ухах','video',21,'Гүн, өргөн хэмжих, хана нурахаас сэргийлэх.'),
   lesson(9,'3. Ажлын техник','Тэгшилгээ ба шороо зөөх','file',9,'Талбай тэгшлэх дараалал, хэмжилтийн шон ашиглах.')
  ];
  const progress={};lessons.slice(0,5).forEach((l,i)=>progress[l.id]={complete:true,completedAt:add(start,i+1)+'T12:00:00+08:00'});
  // Daily sessions (no class on Sunday). Day 14 = safety test, days 15-20 = practice, day 21 = final exam.
  const schedule=[];for(let i=0;i<days;i++){const date=add(start,i);if(weekday(date)===0)continue;const day=i+1;
   schedule.push(day<14?{id:'preview-s'+day,courseId:c,date,time:'10:00',kind:'theory',title:'Онолын хичээл',location:'Анги 204'}
    :day===14?{id:'preview-s'+day,courseId:c,date,time:'11:00',kind:'exam',title:'Аюулгүй ажиллагааны шалгалт',location:'Анги 204'}
    :day<days?{id:'preview-s'+day,courseId:c,date,time:'09:00',kind:'practice',title:'Машин дээрх дадлага',location:'Дадлагын талбай'}
    :{id:'preview-s'+day,courseId:c,date,time:'10:00',kind:'exam',title:'Төгсөлтийн шалгалт',location:'Дадлагын талбай'});}
  const attendance=schedule.filter(s=>s.date<today).map((s,i)=>({studentId:profile.id,courseId:c,date:s.date,present:i!==3}));
  const enrollment={courseId:c,total:850000,paid:550000,registered:start.replaceAll('-','.'),ends:end.replaceAll('-','.'),
   payments:[{amount:300000,recordedAt:start,method:'Бэлэн'},{amount:250000,recordedAt:add(start,4),method:'Банкны шилжүүлэг'}],
   dueDate:add(start,13),manager:'Д. Энхжин'};
  const program={days,start,end,
   stages:[{id:'theory',title:'Онол',from:1,to:13,copy:'Бүтэц, аюулгүй ажиллагаа, ажлын техник'},
    {id:'safety',title:'Аюулгүй ажиллагааны шалгалт',from:14,to:14,copy:'Тест · 70%-иас дээш тэнцэнэ'},
    {id:'practice',title:'Машин дээрх дадлага',from:15,to:days-1,copy:'Багштай хамт бодит машин дээр'},
    {id:'final',title:'Төгсөлтийн шалгалт',from:days,to:days,copy:'Онол ба дадлагын шалгалт'}],
   practice:{required:30,done:0}};
  return {lessons,progress,schedule,attendance,enrollments:{[c]:enrollment},programs:{[c]:program}};
 }
 root.RISE_STUDENT_PREVIEW=build;
})(window);
