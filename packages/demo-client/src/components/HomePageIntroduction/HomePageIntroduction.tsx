import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

import {
  ConfigManager,
  RouterManager,
} from '@gen-epix/ui';

export const HomePageIntroduction = () => {
  const [t] = useTranslation();
  const onExploreCasesButtonClick = useCallback(async () => {
    await RouterManager.instance.router.navigate('/cases');
  }, []);

  return (
    <Box>
      <Box marginY={1}>
        <Typography variant={'h1'}>
          {t('Welcome to {{applicationName}}', { applicationName: ConfigManager.instance.config.applicationName })}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`Aenean tellus leo, placerat ut erat sit amet, vestibulum ornare odio. Nullam blandit sapien ut iaculis euismod. Vestibulum aliquam est vel orci rutrum congue. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam vitae tempor quam, quis posuere est. Fusce vehicula eu nisi eget sodales. Nulla ac consectetur tellus, et gravida risus. Aliquam at dui in justo tincidunt pretium at sed mi. Praesent vestibulum ultricies lectus, cursus dignissim metus placerat at. Mauris placerat ipsum a risus interdum, pellentesque malesuada dui accumsan. Maecenas purus lacus, lobortis et hendrerit et, pretium vel velit.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`Không có ai muốn khổ đau cho chính mình, muốn tìm kiếm về nó và muốn có nó, bởi vì nó là sự đau khổ.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`ไม่มีผู้ใดที่สมัครรักใคร่ในความเจ็บปวด หรือเสาะแสวงหาและปรารถนาจะครอบครองความเจ็บปวด นั่นก็เป็นเพราะว่ามันเจ็บปวด.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`Няма човек, който обича болката сама по себе си, търси я и я желае, само защото е болка.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`Nikdo nemiluje bolest samu, nevyhledává ji, ani ji nechce získat, protože bolest.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`无人爱苦，亦无人寻之欲之，乃因其苦.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Typography>
          {t`Δεν υπάρχει κανείς που να αγαπάει τον ίδιο τον πόνο, να τον αναζητά και να θέλει να τον νιώθει, επειδή απλά είναι πόνος.`}
        </Typography>
      </Box>
      <Box marginY={1}>
        <Button
          color={'primary'}
          onClick={onExploreCasesButtonClick}
        >
          {t`Start exploring the cases`}
        </Button>
      </Box>
    </Box>
  );
};
