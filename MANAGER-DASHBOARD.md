# Менежерийн ажилтны dashboard

`staff.html` → Demo dashboard нээх → `manager.html`.

Хэрэглэгчийн 2 дахь Figma screenshot нь үндсэн чиглэл: хар header, цагаан дугуй хүрээтэй ажлын орон зай, баруун талын My Tasks. Task картуудын цэнхэр, ягаан, шар, ногоон дараалал, тайлбарын дотор самбар, … / × / ✓ гурван дугуй үйлдлийг хадгалсан. Avatar-ийн эх файлууд байхгүй тул emoji ашигласан; screenshot-ийг кодын asset болгон ашиглаагүй. Өгсөн `LOGO-WEB-UM.png` логог өөрчлөлтгүй хуулж header-д харьцааг нь хадгалан оруулсан.

Зүүн хэсэг нь зөвхөн менежерийн өөрийн хариуцсан суралцагчид, төлбөр бүрэн/үлдэгдэлтэй, энэ сард төгсөх үзүүлэлтүүд, week/month goal. Доод хэсэг нь 3 дахь reference-ийн жагсаалт + хар дэлгэрэнгүй самбарын бүтэцтэй: бүртгэлийн дугаар, сургалт/групп, бүртгүүлсэн болон төгсөх огноо, нийт төлбөр, төлсөн дүн, үлдэгдэл.

Ажиллах үйлдлүүд: суралцагч сонгох, нэр/сургалт/бүртгэлээр хайх, үлдэгдэл болон төгсөх шүүлт, зорилго засах, task дуусгах/цуцлах/буцаах, тэмдэглэл хадгалах, profile цэс болон logout. Зорилго ба task-ийн өөрчлөлт local browser storage-д хадгалагдана; үйлдвэрлэлийн role access эсвэл authentication биш.

Бодит суралцагчдын дата хараахан холбогдоогүй. Нэр, сургалтын үнэ, хуваарь, төлбөрүүд нь 6 зохиомол жишээ бүртгэл. 26/18/8/6 нийт үзүүлэлтүүд нь demo; бүрэн backend dataset гэж үзэхгүй. Task доторх текст нь хэрэглэгчийн screenshot-оос авсан. Төлбөрийн түүх нь backend холбогдоогүй төлөвөө ил тод харуулна; бодит төлбөр үүсгэхгүй.

Desktop 1440×900-д төлбөрийн мөр эхний дэлгэцэд харагдана. Нарийн дэлгэцэд суралцагчийн мэдээлэл босоо бүтэц рүү шилжиж, My Tasks доор байрлана. Public homepage-ийн загвар өөрчлөгдөөгүй.

## Glass theme шинэчлэлт
Light, Dark, Night горим header-д сонгогдоно; сонголт `rise-theme` local storage-д хадгалагдана. Slate/ice суурь ба #337fb6 → #6354ed → #9c32e9 → #bf42bc THE RISE gradient ашигласан. Coolors-ийн palette/gradient хэрэгслүүдийг reference болгон үзсэн; task-ийн ice blue, orchid, sand, periwinkle өнгийг энэ сууринд тохируулсан.

901px-ээс өргөн дэлгэцэд page scroll байхгүй, main хэсэг нэг дэлгэцэд багтана. Task болон student жагсаалт тусдаа гүйлгэнэ. My Tasks sticky гарчиг нь 20px backdrop blur, доод fade давхаргатай. 900px-ээс нарийн дэлгэцэд page scroll нээгдэнэ. 1366×768, 1024×600 болон 390×844-д browser-оор шалгасан; compact дэлгэцэд төлбөрийн мөр clipping-гүй. SVG task үйлдэл, theme сонголт reload-ийн дараа хадгалагдахыг шалгасан.


Reference color correction: removed decorative brand gradients. Ice #edf3f9, cool gray #dfe7ec, charcoal #303030, blue-gray #849faf, dark #1c2430, lime #c7ff00. Task cards retain original pastel cyan/pink/yellow/mint and black/red/green SVG action buttons. Sticky title blur remains as requested.

Typography/assets refinement: supplied cat artwork replaces profile and task emoji avatars, supplied monocle image replaces My Tasks emoji. Logo is 82px wide, unboxed. Theme selector exposes light/dark only. The sample name Энхжин is removed. Student tabs use 13–14px type, reference-style inset header and larger count pills; task copy uses 14px type. Laptop 1366×768 verified with payment row fully inside student panel.

Task copy uses Messages-inspired received bubbles: 17px regular native system text, 1.3 line-height, 10×14px padding, 19px corners with a 6px lower-left corner, content-sized width and natural Cyrillic wrapping. iPhone uses its system SF font; Windows uses Segoe UI, without bundling Apple's font. Light bubble #e9e9eb / dark bubble #2c2c2e. Sources: https://developer.apple.com/videos/play/wwdc2020/10175/ and https://support.apple.com/guide/iphone/send-and-reply-to-messages-iph82fb73ba3/ios
