"""Builds Tilt Wave outreach emails exactly as the tracker page shows them.

Usage: python3 outreach.py <lead.json> <sender.json> <step>
Prints {"subject": ..., "body": ...} as JSON.
"""
import json
import sys

SEG = {
    "d2c": {"offer": "product videos, ad creatives and Shopify sites for D2C brands",
            "audit": "your product pages and Instagram",
            "subject": "Free mini-audit for {company}'s product pages & Reels"},
    "startup": {"offer": "launch videos, product explainers and websites for startups",
                "audit": "your website and product story",
                "subject": "Free mini-audit of {company}'s website & product story"},
    "agency": {"offer": "videos, motion design and brand creative", "audit": "",
               "subject": "White-label video & design partner for {company}"},
    "local": {"offer": "websites, promo videos and branding for local businesses",
              "audit": "your website, Google listing and Instagram",
              "subject": "Free 3-point audit for {company}'s website & Instagram"},
}

SAMPLES = {
    "d2c": [("DJI Osmo concept ad", "1a4ciA4UrR40ld8XbuedAVcmpX6Up2qX6"),
            ("Ray-Ban concept ad", "1VzbaM8M1OkTgY9RprqqyzgX7Che-EZKW"),
            ("Floating product shot", "1xGNzKiGxMh5PcaxG3xotkh6muEvp1o9n")],
    "startup": [("AI avatar video", "12dG4NgWuZUKKVJZ4lalqkyLYebriAd0N"),
                ("DJI Osmo concept ad", "1a4ciA4UrR40ld8XbuedAVcmpX6Up2qX6")],
    "agency": [("Motion graphics reel", "1Lx46cr1P7lqBGc-KuoVuJBScD9QOiz3t"),
               ("Ray-Ban concept ad", "1VzbaM8M1OkTgY9RprqqyzgX7Che-EZKW")],
    "local": [("Logo animation (Sunny Enterprise)", "1SH3C_5LPUGVeUeMhDZ1YgWlm6c3k-o2s"),
              ("Tilt Wave promo ad", "1AeYWA0aPoxHwh5_osngYWj4uDQFn4BXO")],
}


def drive(file_id):
    return f"https://drive.google.com/file/d/{file_id}/view"


def fill(text, lead, sender):
    seg = SEG[lead["segment"]]
    company = lead["company"]
    possessive = company + ("'" if company.endswith("s") else "'s")
    for key, value in {
        "{company}'s": possessive,
        "{company}": company, "{angle}": lead["angle"], "{offer}": seg["offer"],
        "{audit}": seg["audit"], "{name}": sender["name"],
        "{portfolio}": sender["portfolio"], "{whatsapp}": sender["whatsapp"],
    }.items():
        text = text.replace(key, value)
    return text


def email_for(lead, sender, step):
    seg = SEG[lead["segment"]]
    subject = fill(seg["subject"], lead, sender)
    agency = lead["segment"] == "agency"
    if step == 1:
        offer = ("We work white-label, so everything goes out under your name. To make it easy to judge us, "
                 "I'd like to do one free sample for you: a short video edit or ad creative for one of your clients."
                 if agency else
                 "Here's my offer: a free mini-audit of {audit}. You'll get 3 specific fixes you can use whether "
                 "or not we ever work together.")
        samples = "\n".join(f"- {t}: {drive(i)}" for t, i in SAMPLES[lead["segment"]])
        body = f"""Hi {{company}} team,

{{angle}}

I run Tilt Wave Studios, a small studio that makes {{offer}}.

{offer}

Interested? Just reply "yes" and I'll send it within 48 hours.

A few samples close to what you'd need:
{samples}

Full portfolio: {{portfolio}}

Thanks,
{{name}}
Tilt Wave Studios
WhatsApp: {{whatsapp}}

If this isn't relevant, reply "no thanks" and I won't email again."""
        return {"subject": subject, "body": fill(body, lead, sender)}
    if step == 2:
        if agency:
            body = """Hi again,

Just checking you saw my note. The free sample offer still stands: send me one client brief and I'll turn around a short video or ad creative under your brand, no charge.

A quick "yes" is all I need.

{name}
Tilt Wave Studios"""
        else:
            body = """Hi again,

Just checking you saw my note. The free mini-audit for {company} still stands: 3 practical fixes, no strings attached.

A quick "yes" is all I need.

{name}
Tilt Wave Studios"""
        return {"subject": "Re: " + subject, "body": fill(body, lead, sender)}
    body = """Hi,

I'll close the loop here so I don't crowd your inbox. If you'd ever like help with videos, a website or branding, reply to this email or WhatsApp me on {whatsapp}.

All the best with {company}!
{name}
Tilt Wave Studios"""
    return {"subject": "Re: " + subject, "body": fill(body, lead, sender)}


if __name__ == "__main__":
    lead = json.load(open(sys.argv[1]))
    sender = json.load(open(sys.argv[2]))
    print(json.dumps(email_for(lead, sender, int(sys.argv[3]))))
