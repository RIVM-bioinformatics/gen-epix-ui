import { Typography } from '@mui/material';
import { Box } from '@mui/system';

export const ConsentDialogContent = () => {
  return (
    <Box>
      <Box marginBottom={1}>
        <Typography component={'p'}>
          {'Voordat u verdergaat, moeten we u laten weten dat u toegang heeft tot een prototypeversie van ons platform.'}
          <br />
          {'Dit prototype is uitsluitend ontworpen voor demonstratiedoeleinden en maakt gebruik van gegevens die, hoewel realistisch, volledig fictief zijn.'}
        </Typography>
      </Box>

      <Typography variant={'h6'}>
        {'U erkent hierbij het volgende:'}
      </Typography>

      <ul>
        <li>
          {'Prototype-aard: u begrijpt dat dit een prototypeversie van het platform is, uitsluitend bedoeld voor test- en feedbackdoeleinden.'}
        </li>
        <li>
          {'Fictieve gegevens: de hier gepresenteerde gegevens zijn gemaakt om realistische scenario\'s te simuleren, maar zijn volledig fictief. Het gaat niet om persoonsgegevens en komt dus niet overeen met individuen in de echte wereld. Elke gelijkenis met echte personen of andere entiteiten uit het echte leven berust louter op toeval.'}
        </li>
        <li>
          {'Geen representatie uit de echte wereld: de gegevens en resultaten die door dit platform worden gegenereerd, mogen niet worden gebruikt, geciteerd of weergegeven als reëel of feitelijk in een echte context, inclusief maar niet beperkt tot academisch, commercieel of openbaar discours.'}
        </li>
      </ul>

      <Typography variant={'h6'}>
        {'Toestemming om door te gaan:'}
      </Typography>

      <Typography
        component={'p'}
        sx={{ marginBottom: 1 }}
      >
        {'Door op \'IK GA AKKOORD\' te klikken, erkent u dat u de prototypeaard van het platform en de fictieve status van de gegevens begrijpt. U stemt ermee in de gegevens niet als echt te gebruiken of in een realistisch scenario weer te geven.'}
      </Typography>
      <Typography
        component={'p'}
        sx={{ marginBottom: 3 }}
      >
        {'Uw begrip en medewerking zijn cruciaal om ons te helpen een beter en nauwkeuriger platform te ontwikkelen voor toekomstige toepassingen in de echte wereld.'}
      </Typography>

      <Typography component={'p'}>
        {'Bedankt voor uw deelname en voor uw waardevolle feedback.'}
      </Typography>

    </Box>
  );
};
