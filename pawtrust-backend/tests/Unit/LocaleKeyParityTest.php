<?php

namespace Tests\Unit;

use Illuminate\Support\Arr;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LocaleKeyParityTest extends TestCase
{
    public static function langFileProvider(): array
    {
        return [
            ['mail.php'],
            ['validation.php'],
            ['auth.php'],
            ['errors.php'],
        ];
    }

    #[DataProvider('langFileProvider')]
    public function test_ru_locale_has_all_ro_keys(string $file): void
    {
        $ro = Arr::dot(require lang_path("ro/{$file}"));
        $ru = Arr::dot(require lang_path("ru/{$file}"));

        $missing = array_diff(array_keys($ro), array_keys($ru));

        $this->assertEmpty($missing, "Missing RU keys in {$file}: " . implode(', ', $missing));
    }

    #[DataProvider('langFileProvider')]
    public function test_ro_locale_has_all_ru_keys(string $file): void
    {
        $ro = Arr::dot(require lang_path("ro/{$file}"));
        $ru = Arr::dot(require lang_path("ru/{$file}"));

        $missing = array_diff(array_keys($ru), array_keys($ro));

        $this->assertEmpty($missing, "Missing RO keys in {$file}: " . implode(', ', $missing));
    }
}
