<?php

return [
    'footer_unsubscribe_note' => 'Acest email a fost trimis automat de PawTrust. Te rugăm să nu răspunzi la acest mesaj.',

    'verification' => [
        'admin_new_request' => [
            'subject' => 'Cerere nouă de verificare — :kennel_name',
            'title'   => 'Cerere nouă de verificare',
            'body'    => ':name (:email) a trimis o cerere de verificare pentru crescătoria :kennel_name. Accesați panoul de administrare pentru a o revizui.',
            'cta'     => 'Revizuiți cererea',
        ],
        'under_review' => [
            'subject' => 'Cererea ta de verificare este în curs de revizuire',
            'title'   => 'Cererea ta este în revizuire',
            'body'    => 'Am primit documentele tale și un specialist PawTrust le revizuiește în acest moment. Te vom anunța cu rezultatul în curând.',
        ],
        'approved' => [
            'subject' => 'Felicitări! Crescătoria ta a fost verificată',
            'title'   => 'Ești acum un crescător verificat PawTrust',
            'body'    => 'Profilul tău și anunțurile tale afișează acum insigna "Verificat". Cumpărătorii pot vedea că ești un crescător de încredere.',
            'cta'     => 'Vezi profilul tău',
        ],
        'rejected' => [
            'subject'        => 'Actualizare privind cererea ta de verificare',
            'title'          => 'Cererea ta de verificare nu a putut fi aprobată',
            'body'           => 'Din păcate, nu am putut aproba cererea ta de verificare din următorul motiv:',
            'resubmit_note'  => 'Poți retrimite cererea oricând din panoul tău de control.',
            'cta'            => 'Retrimite cererea',
        ],
    ],

    'inquiry' => [
        'new_inquiry' => [
            'subject'       => 'Solicitare nouă pentru anunțul ":listing"',
            'title'         => 'Ai primit o solicitare nouă',
            'buyer_label'   => 'Cumpărător',
            'listing_label' => 'Anunț',
            'message_label' => 'Mesaj',
            'no_message'    => 'Niciun mesaj furnizat',
            'cta'           => 'Vezi solicitarea',
        ],
    ],
];
