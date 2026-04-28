# Database Design

Bu klasör VetCare projesinin tüm veritabanı tasarım dosyalarını içerir.

---

## Tasarımı Claude'a nasıl verirsiniz?

Aşağıdaki yöntemlerden **birini veya birkaçını** kullanabilirsiniz — en iyi sonucu en iyi anlayan formata göre verin:

### 1. ERD Diyagram (Resim / PDF)
- Draw.io, Lucidchart, dbdiagram.io veya Miro'dan export ettiğiniz `.png`, `.pdf`, `.svg` dosyasını bu klasöre koyun.
- Claude görsel okuyabilir; ekrana sürükleyip bırakabilir veya dosya yolunu yazabilirsiniz.

### 2. dbdiagram.io DBML Dosyası (Tavsiye Edilen)
- [dbdiagram.io](https://dbdiagram.io) üzerinde tasarımı yapın.
- **Export → DBML** ile `schema.dbml` olarak kaydedin ve bu klasöre atın.
- DBML hem okunabilir hem de direkt SQL'e çevrilebilir.

### 3. SQL DDL Script
- `CREATE TABLE` ifadelerini içeren `.sql` dosyasını bu klasöre koyun.
- Tablolar, kolonlar, veri tipleri, `PRIMARY KEY`, `FOREIGN KEY`, `CONSTRAINT` bilgileriyle birlikte olsun.

### 4. Düz Metin / Excel
- Tablo adı → kolonlar → tipler → kısıtlamalar şeklinde yazdığınız herhangi bir metin veya `.xlsx` dosyasını buraya koyun.
- Claude sohbet penceresine direkt yapıştırmanız da çalışır.

---

## Bu klasörün yapısı

```
database/
├── README.md              ← bu dosya
├── schema.dbml            ← DBML tanımı (dbdiagram.io export)
├── schema.sql             ← DDL scripti (CREATE TABLE ifadeleri)
├── erd.png                ← ERD diyagramı (görsel)
└── migrations/            ← ilerleyen aşamada migration scriptleri
```

---

## Beklenen İçerik

Tasarımınızda şunları belirtin:

| Bilgi | Örnek |
|---|---|
| Tablo adı | `Appointment` |
| Kolon adı ve tipi | `appt_id INT`, `date DATE` |
| Primary Key | `PK appt_id` |
| Foreign Key | `pet_id → Pet.pet_id` |
| Unique / Not Null | `email UNIQUE NOT NULL` |
| Enum / Check kısıtı | `status CHECK IN ('pending','done')` |

---

## Sonraki Adımlar

Tasarımı bu klasöre koyduğunuzda Claude:
1. ERD / şemayı gözden geçirir ve tutarsızlıkları belirtir
2. SQL DDL scriptini oluşturur veya tamamlar
3. Backend için ORM modellerine (SQLAlchemy, Prisma vb.) çevirir
4. Seed data ve migration scriptleri yazar
