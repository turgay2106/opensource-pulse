# Açık kaynak katkı rehberi (özet)

Bu doküman, `oss-eligibility` aracının ölçtüğü hedeflere nasıl ulaşılacağını özetler. Amaç "bedava AI" değil, **gerçek ve düzenli katkı**dır. Programlar başvuruları tek tek inceler ve kabul garantisi yoktur.

## Programlar

| Program | Ne veriyor | Süre | Başvuru |
| --- | --- | --- | --- |
| Claude for Open Source (Anthropic) | Claude Max 20x (Claude Code dahil) | 6 ay | claude.com/contact-sales/claude-for-oss |
| Codex for Open Source (OpenAI) | ChatGPT Pro (Codex dahil), koşullu API kredisi | 6 ay | openai.com/form/codex-for-oss |

### Claude: beş gruptan biri yeterli

| Grup | Şart | Araçta |
| --- | --- | --- |
| Kütüphane sahibi | 500+ bağımlı repo **veya** 100+ bağımlı paket **veya** aylık 200.000+ indirme | `--repo`, `--dependents`, `--downloads` |
| Çekirdek katkıcı | Büyük projelerde listelenmiş committer/maintainer | manuel |
| **Aktif katkıcı** | Son 12 ayda **sahibi olmadığın** repolara 100+ merged PR | otomatik |
| Topluluk kurucusu | Kendi reponda son 12 ayda 20+ farklı dış katkıcı | `--repo` |
| Kritik altyapı | OpenSSF criticality skoru 0.4+ | manuel |

Kriterlere tam uymasan da ekosistemin bağımlı olduğu bir şeyi sürdürüyorsan başvurabilirsin.

### Codex: tek bir repo

Sabit eşik yok. Primary/core maintainer olduğun **bir public repo** gösterirsin; kullanım (star, indirme, bağımlı) ve aktif bakım kanıtı (review, triage, release) aranır.

## Sıfırdan ilk PR'a

1. **Profilini hazırla** — herkese açık, gerçek isim/sabit kullanıcı adı, kısa bio, fotoğraf.
2. **Zaten kullandığın projelerden başla** — tanıdığın kodda hata bulmak ve düzeltmek kolaydır.
3. **Küçük ama gerçek iş seç** — `good first issue`, `help wanted`; ya da dokümantasyondaki yanlış örnek, eksik test, karşılaştığın bir bug.
4. **Önce konuş** — büyük değişiklikten önce issue aç veya yorum yaz.
5. **Fork → branch → küçük commit → PR** — CONTRIBUTING.md'yi oku, testleri yerelde çalıştır.
6. **Review'a 48 saat içinde dön** — merge edilen her PR profilinde kalır.

## Düzenli olmak

100 PR / 12 ay ≈ **haftada 2 PR**. Araç son 12 haftadaki aktif hafta sayını ve bu hızla hedefe kaç hafta kaldığını gösterir.

| Yap | Yapma |
| --- | --- |
| Haftada sabit bir zaman ayır | Sadece typo düzelten toplu PR'lar (spam sayılır) |
| 2–3 projede derinleş | Okumadan AI'ya yazdırılmış PR'lar |
| Her PR'da testleri çalıştır | Konuşmadan büyük refactor |
| Merge edilen PR'ları listele (bu araç yapar) | Kendi boş repona commit atıp grafiği doldurmak |

### İlk 30 gün

| Hafta | Hedef |
| --- | --- |
| 1 | Profil düzenle, kullandığın 3 projeyi seç, CONTRIBUTING.md'lerini oku |
| 2 | İlk PR: dokümantasyon veya küçük bug |
| 3 | 2 PR daha + bir issue'da yeniden üretme adımları yaz |
| 4 | Aynı repoya 2–3 PR: tekrar eden katkıcı ol |

Her hafta `oss-eligibility` raporunu çalıştırıp ilerlemeni takip et.

## Form yazarken üç kural

- **Sayı ve link ver** — "42 merged PR, işte listesi".
- **Kullanım projeye dönük olsun** — "şu reponun review'unu hızlandıracağım".
- **Kısa tut** — her alan 3–5 cümle.

> Bilgiler 2026 itibarıyla; şartlar ve fiyatlar değişebilir. Başvurmadan önce program sayfalarını kontrol et.
